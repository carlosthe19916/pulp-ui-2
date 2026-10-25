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
  useDataViewFilters,
  useDataViewPagination,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { RevealCellOnExpand } from "@app/components/RevealCellOnExpand";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import {
  type IAnsibleCollectionListParams,
  useAnsibleCollectionsListQuery,
} from "@app/queries/ansible-collections";
import type { OrderingField } from "@app/queries/utils/listParams";
import type { DataViewTh } from "@app/utils/dataViewTypes";

import { CollectionVersions } from "./components/CollectionVersions";

const SORTABLE_COLUMN_KEYS = [
  "namespace",
  "name",
] as const satisfies readonly OrderingField<IAnsibleCollectionListParams>[];

interface ICollectionFilters {
  namespace: string;
  name: string;
  tags: string;
}

/** Ansible collections (namespace + name), each expanding to its versions. */
export const AnsibleCollectionList: React.FC = () => {
  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "namespace", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<ICollectionFilters>({
      initialFilters: { namespace: "", name: "", tags: "" },
    });
  const namespace = useDebouncedValue({ value: filters.namespace });
  const name = useDebouncedValue({ value: filters.name });
  const tags = useDebouncedValue({ value: filters.tags });

  const { data, isLoading, error } = useAnsibleCollectionsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      namespace: namespace || undefined,
      name: name || undefined,
    },
  });
  const collections = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const idOf = (collection: { namespace: string; name: string }) =>
    `${collection.namespace}.${collection.name}`;

  const columns: DataViewTh[] = [
    { cell: "Namespace", props: { sort: sortProps("namespace"), width: 50 } },
    { cell: "Name", props: { sort: sortProps("name"), width: 50 } },
  ];
  const rows: DataViewTr[] = collections.map((collection) => ({
    id: idOf(collection),
    row: [
      { cell: collection.namespace, props: { dataLabel: "Namespace" } },
      { cell: collection.name, props: { dataLabel: "Name" } },
    ],
  }));
  const expandedRows = collections.map((collection) => ({
    rowId: idOf(collection),
    columnId: 0,
    content: (
      <RevealCellOnExpand>
        {() => (
          <CollectionVersions
            key={tags}
            namespace={collection.namespace}
            name={collection.name}
            tags={tags}
          />
        )}
      </RevealCellOnExpand>
    ),
  }));

  const isFiltered = !!namespace || !!name || !!tags;
  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: collections.length === 0,
    emptyState: (
      <TableEmptyState
        title="No collections found"
        isFiltered={isFiltered}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  return (
    <>
      <DocumentTitle title="Ansible collections" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Ansible collections</Content>
        <Content component={ContentVariants.p}>
          Every collection across repositories. Expand one to see its versions;
          the tag filter narrows the versions shown.
        </Content>
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
                <DataViewTextFilter filterId="namespace" title="Namespace" />
                <DataViewTextFilter filterId="name" title="Name" />
                <DataViewTextFilter
                  filterId="tags"
                  title="Version tags"
                  placeholder="Comma-separated tags"
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
            aria-label="Ansible collections table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
            isExpandable
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
