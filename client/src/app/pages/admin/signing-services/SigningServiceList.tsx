import type React from "react";

import {
  Content,
  ContentVariants,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Pagination,
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
  computeActiveState,
  dataViewBodyStates,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useSigningServicesListQuery } from "@app/queries/signing-services";
import { isForbiddenError } from "@app/utils/isHttpError";

interface ISigningServiceFilters {
  name: string;
}

export const SigningServiceList: React.FC = () => {
  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<ISigningServiceFilters>({
      initialFilters: { name: "" },
    });

  const { data, isLoading, error } = useSigningServicesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name: filters.name || undefined,
  });

  const services = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = ["Name", "Public Key Fingerprint", "Script"];

  const rows: DataViewTr[] = services.map((service) => {
    const fp = service.pubkey_fingerprint ?? "";
    return {
      id: service.pulp_href,
      row: [
        { cell: service.name, props: { dataLabel: "Name" } },
        {
          cell: fp.length > 24 ? `${fp.slice(0, 24)}...` : fp || "—",
          props: { dataLabel: "Public Key Fingerprint" },
        },
        { cell: service.script ?? "—", props: { dataLabel: "Script" } },
      ],
    };
  });

  const activeState = computeActiveState({
    isLoading,
    isError: !!error,
    isEmpty: services.length === 0,
  });

  const pagination = (
    <Pagination
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
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Signing Services</Content>
          <Content component={ContentVariants.p}>
            Signing services are provisioned by an administrator via the Pulp
            API or CLI; they can&apos;t be created, edited, or deleted from this
            UI.
          </Content>

          <DataView activeState={activeState}>
            <DataViewToolbar
              clearAllFilters={clearAllFilters}
              filters={
                <DataViewFilters
                  onChange={(_key, newFilters) => onSetFilters(newFilters)}
                  values={filters}
                >
                  <DataViewTextFilter filterId="name" title="Name" />
                </DataViewFilters>
              }
              pagination={pagination}
            />

            <DataViewTable
              aria-label="Signing services table"
              columns={columns}
              rows={rows}
              bodyStates={dataViewBodyStates({
                empty: (
                  <EmptyState
                    titleText="No signing services found"
                    headingLevel="h4"
                  >
                    <EmptyStateBody>
                      {filters.name
                        ? "No signing services match the current filter. Try a different search term."
                        : "Signing services aren't managed from this UI. Ask an administrator to provision one via the Pulp API or CLI."}
                    </EmptyStateBody>
                  </EmptyState>
                ),
              })}
            />

            <DataViewToolbar pagination={pagination} />
          </DataView>
        </PageSection>
      )}
    </>
  );
};
