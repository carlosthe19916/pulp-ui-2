import type React from "react";

import {
  Content,
  ContentVariants,
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
import { ContentDetailPanel } from "@app/components/ContentDetailPanel";
import {
  compoundExpansions,
  dataViewBodyStates,
  ListPagination,
  MultiSelectFilter,
  type DataViewTh,
  type IMultiSelectOption,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { IContentListParams } from "@app/queries/content";
import { useContentListQuery } from "@app/queries/content";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { contentIdentifier } from "@app/utils/contentIdentifier";
import { formatDateTime } from "@app/utils/utils";

/**
 * Filters for the global Content list. `pulp_type` is a closed server-side enum,
 * so Type is a multi-select (free text 400s) sent as `pulp_type__in`; the aggregate
 * has no free-text `q`, so the search box maps to `pulp_label_select`.
 */
interface IContentFilters {
  pulp_type: string[];
  pulp_label_select: IContentListParams["pulp_label_select"];
}

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

  const content = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Type", props: { width: 20 } },
    { cell: "Identifier", props: { width: 50 } },
    { cell: "Created", props: { width: 25 } },
  ];

  const rows: DataViewTr[] = content.map((unit) => {
    const record = unit as Record<string, unknown>;
    const href = typeof record.pulp_href === "string" ? record.pulp_href : "";
    const pulpType = resolvePulpType(href);
    return {
      id: href,
      row: [
        {
          cell: pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: contentIdentifier(record),
          props: { dataLabel: "Identifier", modifier: "truncate" },
        },
        {
          cell:
            typeof record.pulp_created === "string"
              ? (formatDateTime(record.pulp_created) ?? "—")
              : "—",
          props: { dataLabel: "Created" },
        },
      ],
    };
  });

  const IDENTIFIER_COLUMN_INDEX = 1;
  const expandedRows: ExpandableContent[] = compoundExpansions({
    entities: content,
    columnIndex: IDENTIFIER_COLUMN_INDEX,
    rowId: (unit) => unit.pulp_href ?? "",
    render: (unit) => <ContentDetailPanel href={unit.pulp_href ?? ""} />,
  });

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
