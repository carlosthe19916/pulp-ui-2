import type React from "react";
import { use, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSort,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { DistributionResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { EntityModal } from "@app/components/Entity/EntityModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { getAvailablePlugins } from "@catalog";
import { DISTRIBUTION_FAMILY } from "@app/queries/utils/families";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useEntityDelete } from "@app/hooks/useEntityDelete";
import { useDistributionsListQuery } from "@app/queries/distributions";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

/** The aggregation endpoint returns pulp_type at runtime but the generated type omits it. */
type DistributionRow = DistributionResponse & { pulp_type?: string };

const COLUMN_KEYS = [
  "name",
  "base_path",
  "type",
  "repository",
  "actions",
] as const;
type DistributionColumnKey = (typeof COLUMN_KEYS)[number];

interface IDistributionFilters {
  name: string;
  pulp_type: string;
}

export const DistributionList: React.FC = () => {
  const [deleteTarget, setDeleteTarget] = useState<DistributionRow | null>(
    null,
  );
  // Single source of truth for the create/edit modal: "create", a row to edit,
  // or null (closed) — so create and edit can never be open at once.
  const [modalState, setModalState] = useState<
    "create" | DistributionRow | null
  >(null);

  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const { deleteEntity, isDeleting } = useEntityDelete(DISTRIBUTION_FAMILY);
  const { name: pulpDomain } = useSelectedDomain();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "name", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IDistributionFilters>({
      initialFilters: { name: "", pulp_type: "" },
    });
  const debouncedName = useDebouncedValue(filters.name);
  const debouncedPulpType = useDebouncedValue(filters.pulp_type);

  const ordering = toOrderingParam(sortBy, direction) as "name" | "-name";

  const { data, isLoading, error } = useDistributionsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
    pulp_type: debouncedPulpType
      ? (debouncedPulpType as NonNullable<
          Parameters<typeof useDistributionsListQuery>[0]
        >["pulp_type"])
      : undefined,
  });

  const distributions = (data?.results ?? []) as DistributionRow[];
  const totalCount = data?.count ?? 0;

  const canCreate = getAvailablePlugins("distribution", plugins).length > 0;

  const sortProps = (columnKey: DistributionColumnKey) =>
    buildThSort({
      columnKeys: COLUMN_KEYS,
      columnKey,
      sortBy,
      direction,
      onSort: (event, sortedKey, newDirection) => {
        onSort(event, sortedKey, newDirection);
        onSetPage(undefined, 1);
      },
    });

  const columns = [
    { cell: "Name", props: { sort: sortProps("name") } },
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
    const pulpType = resolvePulpType(
      distribution.pulp_type,
      distribution.pulp_href,
    );

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
    if (!deleteTarget?.pulp_href) return;
    try {
      await deleteEntity(deleteTarget);
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
              canCreate ? (
                <Button
                  variant="primary"
                  onClick={() => setModalState("create")}
                >
                  Create distribution
                </Button>
              ) : undefined
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
          entity={
            modalState === "create" ? undefined : (modalState ?? undefined)
          }
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
