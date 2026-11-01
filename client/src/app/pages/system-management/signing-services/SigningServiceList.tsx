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
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useSigningServicesListQuery } from "@app/queries/signing-services";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";

import {
  SIGNING_SERVICE_LIST_STATE,
  SORTABLE_COLUMN_KEYS,
} from "./signingServiceListState";

export const SigningServiceList: React.FC = () => {
  const [pagination, setPagination] = usePersistentState({
    ...SIGNING_SERVICE_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...SIGNING_SERVICE_LIST_STATE.sort,
    storage: "url",
  });
  const { ordering, sortProps } = columnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    sort,
    onSort: (next) => {
      setSort(next);
      toFirstPage();
    },
  });

  const [filters, setFilters] = usePersistentState({
    ...SIGNING_SERVICE_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(SIGNING_SERVICE_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useSigningServicesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name: debouncedName || undefined,
    },
  });

  const services = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 25 } },
    { cell: "Public Key Fingerprint", props: { width: 45 } },
    { cell: "Script", props: { width: 30 } },
  ];

  const rows: DataViewTr[] = services.map((service) => {
    const fp = service.pubkey_fingerprint ?? "";
    return {
      id: service.pulp_href,
      row: [
        { cell: service.name, props: { dataLabel: "Name" } },
        {
          cell: fp || "—",
          props: { dataLabel: "Public Key Fingerprint", modifier: "truncate" },
        },
        {
          cell: service.script ?? "—",
          props: { dataLabel: "Script", modifier: "truncate" },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: services.length === 0,
    emptyState: (
      <TableEmptyState
        title="No signing services found"
        body="Signing services aren't managed from this UI. Ask an administrator to provision one via the Pulp API or CLI."
        filteredTitle="No signing services found"
        filteredBody="No signing services match the current filter. Try a different search term."
        isFiltered={Boolean(debouncedName)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  return (
    <>
      <DocumentTitle title="Signing Services" />
      <PageSection>
        <Content component={ContentVariants.h1}>Signing Services</Content>
        <Content component={ContentVariants.p}>
          Signing services are provisioned by an administrator via the Pulp API
          or CLI; they can&apos;t be created, edited, or deleted from this UI.
        </Content>
      </PageSection>
      <PageSection>
        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  setFilters((prev) => ({ ...prev, ...newFilters }));
                  toFirstPage();
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Name" />
              </DataViewFilters>
            }
            pagination={
              <ListPagination
                variant={PaginationVariant.top}
                itemCount={totalCount}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            }
          />

          <DataViewTable
            aria-label="Signing services table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar
            pagination={
              <ListPagination
                variant={PaginationVariant.bottom}
                itemCount={totalCount}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            }
          />
        </DataView>
      </PageSection>
    </>
  );
};
