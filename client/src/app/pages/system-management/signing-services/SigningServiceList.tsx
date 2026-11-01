import type React from "react";

import {
  Content,
  ContentVariants,
  PageSection,
  PaginationVariant,
  Truncate,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
  type ExpandableContent,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ListPagination } from "@app/components/ListPagination";
import { RevealCellOnExpand } from "@app/components/RevealCellOnExpand";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useSigningServicesListQuery } from "@app/queries/signing-services";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { formatDateTime } from "@app/utils/utils";

import { FingerprintCopy } from "./components/FingerprintCopy";
import { SigningServiceDetails } from "./components/SigningServiceDetails";
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
    { cell: "Fingerprint", props: { width: 35 } },
    { cell: "Script", props: { width: 25 } },
    { cell: "Created", props: { sort: sortProps("pulp_created"), width: 15 } },
  ];

  const rows: DataViewTr[] = services.map((service) => ({
    id: service.pulp_href,
    row: [
      { cell: service.name, props: { dataLabel: "Name" } },
      {
        cell: <FingerprintCopy fingerprint={service.pubkey_fingerprint} />,
        props: { dataLabel: "Fingerprint" },
      },
      {
        // The file name is the telling part of the path, so keep both ends.
        cell: service.script ? (
          <Truncate content={service.script} position="middle" />
        ) : (
          "—"
        ),
        props: { dataLabel: "Script" },
      },
      {
        cell: formatDateTime(service.pulp_created) ?? "—",
        props: { dataLabel: "Created" },
      },
    ],
  }));

  const expandedRows: ExpandableContent[] = services.map((service) => ({
    rowId: service.pulp_href ?? "",
    columnId: 0,
    content: (
      <RevealCellOnExpand>
        {() => <SigningServiceDetails service={service} />}
      </RevealCellOnExpand>
    ),
  }));

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
        filteredBody="The name filter matches whole names only. Check the spelling, including case."
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
          A signing service signs repository metadata and packages with a GPG
          key. Administrators provision them through the Pulp API or CLI; share
          a service&apos;s public key with clients so they can verify what they
          download. Expand a row to copy or download the key.
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
                <DataViewTextFilter
                  filterId="name"
                  title="Name"
                  placeholder="Filter by exact name"
                />
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
                onPaginationChange={setPagination}
              />
            }
          />
        </DataView>
      </PageSection>
    </>
  );
};
