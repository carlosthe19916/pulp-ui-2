import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import {
  Button,
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
import { ActionsColumn } from "@patternfly/react-table";

import type { DistributionResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates, useColumnSort } from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { EntityModal } from "@app/components/Entity/EntityModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useEntityDelete } from "@app/hooks/useEntityDelete";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { IDistributionListParams } from "@app/queries/distributions";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { DISTRIBUTION_FAMILY } from "@app/queries/utils/families";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<IDistributionListParams>[];

interface IDistributionFilters {
  name: IDistributionListParams["name"];
  pulp_type: IDistributionListParams["pulp_type"];
}

export const DistributionList: React.FC = () => {
  const { name: pulpDomain } = useSelectedDomain();

  const [modalState, setModalState] = useState<
    "create" | DistributionResponse | null
  >(null);
  const distributionToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);

  const [deleteTarget, setDeleteTarget] = useState<DistributionResponse | null>(
    null,
  );

  const { deleteEntity, isDeleting } = useEntityDelete(DISTRIBUTION_FAMILY);

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });

  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IDistributionFilters>({});
  const debouncedName = useDebouncedValue(filters.name);
  const debouncedPulpType = useDebouncedValue(filters.pulp_type);

  const { data, isLoading, error } = useDistributionsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
    pulp_type: debouncedPulpType || undefined,
  });

  const distributions = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = [
    {
      cell: "Name",
      props: {
        sort: sortProps("name"),
      },
    },
    "Base Path",
    "Type",
    "Repository",
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = distributions.map((distribution) => {
    const distId = extractIdFromHref(distribution.pulp_href ?? "");
    const pulpType = resolvePulpType(distribution.pulp_href);

    return {
      id: distribution.pulp_href,
      row: [
        {
          cell: distId ? (
            <Link
              to="/content-management/$pulpDomain/distributions/$distId"
              params={{ pulpDomain, distId }}
            >
              {distribution.name}
            </Link>
          ) : (
            distribution.name
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: distribution.base_path || "—",
          props: { dataLabel: "Base Path" },
        },
        {
          cell: pulpType ? (
            <PulpTypeLabel kind="distribution" pulpType={pulpType} />
          ) : (
            "—"
          ),
          props: { dataLabel: "Type" },
        },
        {
          cell: (
            <ResourceHrefLink
              kind="repository"
              href={distribution.repository}
            />
          ),
          props: { dataLabel: "Repository" },
        },
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
                  onClick: () => setModalState(distribution),
                },
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(distribution),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: distributions.length === 0,
    emptyState: (
      <TableEmptyState
        title="No distributions found"
        isFiltered={Boolean(debouncedName || debouncedPulpType)}
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

  const handleDelete = async () => {
    if (!deleteTarget || !deleteTarget.pulp_href) return;
    try {
      await deleteEntity({
        name: deleteTarget.name,
        pulp_href: deleteTarget.pulp_href,
      });
    } catch {
      // Notifications are handled in useEntityDelete.
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Distributions" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Distributions</Content>

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
                <DataViewTextFilter
                  filterId="pulp_type"
                  title="Type"
                  placeholder="pulp_type (e.g. file.file)"
                />
              </DataViewFilters>
            }
            actions={
              <Button variant="primary" onClick={() => setModalState("create")}>
                Create distribution
              </Button>
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Distributions table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <EntityModal
          config={DISTRIBUTION_FAMILY}
          isOpen={modalState !== null}
          entity={distributionToEdit}
          onClose={() => setModalState(null)}
        />

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Distribution"
          body={`Are you sure you want to delete distribution "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};
