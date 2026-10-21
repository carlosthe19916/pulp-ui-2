import type React from "react";

import {
  ClipboardCopy,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  LabelGroup,
  PageSection,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
  type ExpandableContent,
  useDataViewFilters,
  useDataViewPagination,
} from "@patternfly/react-data-view";

import { getContentTypes } from "@catalog";
import type { MultipleArtifactContentResponse } from "@app/client";
import {
  dataViewBodyStates,
  ListPagination,
  MultiSelectFilter,
  type DataViewTh,
  type IMultiSelectOption,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { IContentListParams } from "@app/queries/content";
import { useContentListQuery } from "@app/queries/content";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

/**
 * The aggregate `content/` response carries an `artifacts` map (relative path →
 * artifact href), but the OpenAPI generator drops it (it's declared as an untyped
 * `object`), so the generated `MultipleArtifactContentResponse` omits it. Extend the
 * type here rather than editing the generated client. Values are nullable: on-demand
 * content has the path key present with no downloaded artifact behind it.
 */
type IContentUnit = MultipleArtifactContentResponse & {
  artifacts?: Record<string, string | null>;
};

/**
 * Filters for the global Content list. `pulp_type` is a closed server-side enum,
 * so Type is a multi-select (free text 400s) sent as `pulp_type__in`; the aggregate
 * has no free-text `q`, so the search box maps to `pulp_label_select`.
 */
interface IContentFilters {
  pulp_type: string[];
  pulp_label_select: IContentListParams["pulp_label_select"];
}

/** Zero-based index of the Artifacts column — the compound-expand toggle lives here. */
const ARTIFACTS_COLUMN_INDEX = 2;

/** The GitHub-style short identifier: first 8 chars of the PRN's/href's uuid. */
const SHORT_ID_LENGTH = 8;

/** The uuid segment of a PRN (`prn:<type>:<uuid>`), falling back to the href's pk. */
const unitUuid = (unit: IContentUnit): string => {
  if (unit.prn) return unit.prn.split(":").pop() ?? unit.prn;
  const parts = (unit.pulp_href ?? "").split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
};

/** Expanded-row body: the row's own artifacts map — no extra REST call. */
const ArtifactsPanel: React.FC<{
  artifacts: Record<string, string | null>;
}> = ({ artifacts }) => (
  <DescriptionList isCompact>
    {Object.entries(artifacts).map(([relativePath, href]) => (
      <DescriptionListGroup key={relativePath}>
        <DescriptionListTerm>{relativePath}</DescriptionListTerm>
        <DescriptionListDescription>
          {href ? (
            <ClipboardCopy variant="inline-compact" isReadOnly>
              {href}
            </ClipboardCopy>
          ) : (
            "Not downloaded"
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    ))}
  </DescriptionList>
);

export const ContentList: React.FC = () => {
  const pagination = useDataViewPagination({ perPage: 10 });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IContentFilters>({});
  const debouncedLabel = useDebouncedValue({
    value: filters.pulp_label_select,
  });
  const selectedTypes = filters.pulp_type ?? [];

  // Type options are the catalog's content types for installed plugins, grouped by
  // their owning app (the pulp_type prefix). Each pulpType is a valid content
  // `pulp_type`, so it filters safely via pulp_type__in.
  const typeOptions: IMultiSelectOption[] = getContentTypes({
    installed: useApiStatus().plugins,
  }).map((ct) => ({
    label: ct.pulpType,
    value: ct.pulpType,
    group: ct.pulpType.split(".")[0],
  }));

  // The aggregate content endpoint only orders by `pk`, so this list is not
  // column-sortable; no `ordering` is passed.
  const { data, isLoading, error } = useContentListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      pulp_type__in: selectedTypes.length
        ? (selectedTypes as IContentListParams["pulp_type__in"])
        : undefined,
      pulp_label_select: debouncedLabel || undefined,
    },
  });

  const content = (data?.results ?? []) as IContentUnit[];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "PRN", props: { width: 15 } },
    { cell: "Type", props: { width: 20 } },
    { cell: "Artifacts", props: { width: 15 } },
    { cell: "Labels", props: { width: 30 } },
    { cell: "Created", props: { width: 20 } },
  ];

  const rows: DataViewTr[] = content.map((unit) => {
    const pulpType = resolvePulpType(unit.pulp_href);
    const artifacts = unit.artifacts ?? {};
    const labelEntries = Object.entries(unit.pulp_labels ?? {});
    return {
      id: unit.pulp_href,
      row: [
        {
          cell: (
            <ResourceHrefLink
              kind="content"
              href={unit.pulp_href}
              label={unitUuid(unit).slice(0, SHORT_ID_LENGTH)}
            />
          ),
          props: { dataLabel: "PRN" },
        },
        {
          cell: pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: Object.keys(artifacts).length,
          props: { dataLabel: "Artifacts" },
        },
        {
          cell: labelEntries.length ? (
            <LabelGroup numLabels={3} isCompact>
              {labelEntries.map(([key, value]) => (
                <Label key={key} color="grey" isCompact>
                  {value == null ? key : `${key}=${value}`}
                </Label>
              ))}
            </LabelGroup>
          ) : (
            "—"
          ),
          props: { dataLabel: "Labels" },
        },
        {
          cell: formatDateTime(unit.pulp_created) ?? "—",
          props: { dataLabel: "Created" },
        },
      ],
    };
  });

  // Only rows with artifacts are expandable; the toggle attaches to the Artifacts
  // cell (ARTIFACTS_COLUMN_INDEX). The panel reads the artifacts already on the row.
  const expandedRows: ExpandableContent[] = content
    .filter((unit) => Object.keys(unit.artifacts ?? {}).length > 0)
    .map((unit) => ({
      rowId: unit.pulp_href ?? "",
      columnId: ARTIFACTS_COLUMN_INDEX,
      content: <ArtifactsPanel artifacts={unit.artifacts ?? {}} />,
    }));

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: content.length === 0,
    emptyState: (
      <TableEmptyState
        title="No content found"
        isFiltered={Boolean(selectedTypes.length || debouncedLabel)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  return (
    <>
      <DocumentTitle title="Content" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Content</Content>
      </PageSection>
      <PageSection>
        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  onSetFilters(newFilters);
                  pagination.onSetPage(undefined, 1);
                }}
                values={filters}
              >
                <MultiSelectFilter
                  filterId="pulp_type"
                  title="Type"
                  options={typeOptions}
                  searchPlaceholder="Search types…"
                />
                <DataViewTextFilter
                  filterId="pulp_label_select"
                  title="Label"
                />
              </DataViewFilters>
            }
            pagination={
              <ListPagination
                variant={PaginationVariant.top}
                itemCount={totalCount}
                pagination={pagination}
              />
            }
          />

          <DataViewTable
            aria-label="Content table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
            isExpandable={expandedRows.length > 0}
            expandedRows={expandedRows}
            indexBy="id"
          />

          <DataViewToolbar
            pagination={
              <ListPagination
                variant={PaginationVariant.bottom}
                itemCount={totalCount}
                pagination={pagination}
              />
            }
          />
        </DataView>
      </PageSection>
    </>
  );
};
