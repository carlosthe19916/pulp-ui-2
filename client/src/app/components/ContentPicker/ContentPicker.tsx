import type React from "react";
import { useState } from "react";

import type { IContentType } from "@catalog";

import {
  EmptyState,
  EmptyStateBody,
  FormSelect,
  FormSelectOption,
  Label,
  PaginationVariant,
  SearchInput,
  Switch,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  type DataViewTr,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import {
  dataViewSelection,
  type IContentUnitSelection,
} from "@app/hooks/useContentUnitSelection";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useContentTypeListQuery } from "@app/queries/content";
import type {
  ContentTypeKey,
  IContentTypeListParams,
} from "@app/queries/contentTypes";
import { toUnitRefs } from "@app/utils/contentUnitLabel";
import { getContentSearch } from "@plugins";

import { notInVersionQuery } from "./notInVersionQuery";

interface IContentPickerProps {
  /** Content types the user can pick from (each has a list endpoint). */
  contentTypes: IContentType[];
  /** The target repository's latest version, to mark or hide what it already has. */
  latestVersionHref?: string;
  /** Limit the list to one version's content (the "From another repository" source). */
  sourceVersionHref?: string;
  repositoryName: string;
  selection: IContentUnitSelection;
}

/**
 * Selectable list of one content type at a time, with search and a toggle that hides what
 * the target repository already has.
 */
export const ContentPicker: React.FC<IContentPickerProps> = ({
  contentTypes,
  latestVersionHref,
  sourceVersionHref,
  repositoryName,
  selection,
}) => {
  const [pulpType, setPulpType] = useState(contentTypes[0]?.pulpType ?? "");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue({ value: search });
  // From another repository, the point is what the target is missing: hide the rest.
  const [hidePresent, setHidePresent] = useState(!!sourceVersionHref);
  const pagination = useDataViewPagination({ perPage: 10 });
  const searchDef = getContentSearch(pulpType);
  const typeKey = pulpType as ContentTypeKey;

  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: typeKey,
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ...(hidePresent && latestVersionHref
        ? {
            q: notInVersionQuery({
              notInVersionHref: latestVersionHref,
              inVersionHref: sourceVersionHref,
            }),
          }
        : { repository_version: sourceVersionHref }),
      ...(searchDef && debouncedSearch
        ? { [searchDef.param]: debouncedSearch }
        : {}),
    } as IContentTypeListParams<ContentTypeKey>,
    options: { enabled: !!pulpType },
  });
  const rows = (data?.results ?? []) as { pulp_href?: string | null }[];
  const units = toUnitRefs({
    rows,
    rowHref: (row) => row.pulp_href,
    pulpType,
  });

  const pageHrefs = units.map((unit) => unit.href);
  const { data: present } = useContentTypeListQuery({
    pulpType: typeKey,
    params: {
      limit: pageHrefs.length,
      pulp_href__in: pageHrefs,
      repository_version: latestVersionHref,
      fields: ["pulp_href"],
    } as IContentTypeListParams<ContentTypeKey>,
    options: {
      enabled: !hidePresent && !!latestVersionHref && pageHrefs.length > 0,
    },
  });
  const presentHrefs = new Set(
    ((present?.results ?? []) as { pulp_href?: string | null }[]).map(
      (row) => row.pulp_href,
    ),
  );

  const resetPage = () => pagination.onSetPage(undefined, 1);

  const tbody: DataViewTr[] = units.map((unit) => ({
    id: unit.href,
    row: [
      {
        cell: (
          <>
            {unit.label}{" "}
            {presentHrefs.has(unit.href) && (
              <Label isCompact color="grey">
                In repository
              </Label>
            )}
          </>
        ),
        props: { dataLabel: "Content" },
      },
    ],
  }));

  const isFiltered = !!debouncedSearch;
  let empty = {
    title: "No content to add",
    body: "There is no content of this type.",
  };
  if (isFiltered) {
    empty = {
      title: "No results found",
      body: "No content matches the search.",
    };
  } else if (hidePresent) {
    empty = {
      title: sourceVersionHref ? "Nothing missing" : "No content to add",
      body: `"${repositoryName}" already has all of this content.`,
    };
  }
  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: 1,
    hasSelectionColumn: true,
    loadingRows: pagination.perPage,
    isLoading,
    error,
    isEmpty: units.length === 0,
    emptyState: (
      <EmptyState
        variant="sm"
        icon={SearchIcon}
        headingLevel="h4"
        titleText={empty.title}
      >
        <EmptyStateBody>{empty.body}</EmptyStateBody>
      </EmptyState>
    ),
  });

  return (
    <DataView
      activeState={activeState}
      selection={dataViewSelection({
        selection,
        units,
        isSelectDisabled: (href) => presentHrefs.has(href),
      })}
    >
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <FormSelect
              aria-label="Content type"
              value={pulpType}
              onChange={(_event, value) => {
                setPulpType(value);
                setSearch("");
                resetPage();
              }}
            >
              {contentTypes.map((type) => (
                <FormSelectOption
                  key={type.pulpType}
                  value={type.pulpType}
                  label={type.pulpType}
                />
              ))}
            </FormSelect>
          </ToolbarItem>
          {searchDef && (
            <ToolbarItem>
              <SearchInput
                aria-label={`Search by ${searchDef.label}`}
                placeholder={`Search by ${searchDef.label}`}
                value={search}
                onChange={(_event, value) => {
                  setSearch(value);
                  resetPage();
                }}
                onClear={() => setSearch("")}
              />
            </ToolbarItem>
          )}
          {latestVersionHref && (
            <ToolbarItem alignSelf="center">
              <Switch
                id={`hide-present-${sourceVersionHref ? "source" : "all"}`}
                label={
                  sourceVersionHref
                    ? `Only content missing from "${repositoryName}"`
                    : `Hide content already in "${repositoryName}"`
                }
                isChecked={hidePresent}
                onChange={(_event, checked) => {
                  setHidePresent(checked);
                  resetPage();
                }}
              />
            </ToolbarItem>
          )}
          <ToolbarItem variant="pagination">
            <ListPagination
              variant={PaginationVariant.top}
              itemCount={data?.count ?? 0}
              pagination={pagination}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <DataViewTable
        aria-label="Content to add"
        columns={[{ cell: "Content" }]}
        rows={tbody}
        bodyStates={bodyStates}
      />
    </DataView>
  );
};
