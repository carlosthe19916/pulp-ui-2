import type React from "react";

import {
  Content,
  ContentVariants,
  PageSection,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { ISigningServiceListParams } from "@app/queries/signing-services";
import { useSigningServicesListQuery } from "@app/queries/signing-services";
import type { OrderingField } from "@app/queries/utils/listParams";

const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<ISigningServiceListParams>[];

interface ISigningServiceFilters {
  name: ISigningServiceListParams["name"];
}

export const SigningServiceList: React.FC = () => {
  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<ISigningServiceFilters>({});
  const debouncedName = useDebouncedValue(filters.name);

  const { data, isLoading, error } = useSigningServicesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name: debouncedName || undefined,
  });

  const services = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name") } },
    "Public Key Fingerprint",
    "Script",
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

  const pagination = (variant: PaginationVariant) => (
    <Pagination
      variant={variant}
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

  return (
    <>
      <DocumentTitle title="Signing Services" />
      <PageSection>
        <Content component={ContentVariants.h1}>Signing Services</Content>
        <Content component={ContentVariants.p}>
          Signing services are provisioned by an administrator via the Pulp API
          or CLI; they can&apos;t be created, edited, or deleted from this UI.
        </Content>

        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  onSetFilters(newFilters);
                  onSetPage(undefined, 1);
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Name" />
              </DataViewFilters>
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Signing services table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>
      </PageSection>
    </>
  );
};
