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
import { ActionsColumn, type IAction } from "@patternfly/react-table";
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

import type { RepositoryResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { EntityModal } from "@app/components/Entity/EntityModal";
import { PublishModal } from "@app/components/PublishModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { SyncModal } from "@app/components/SyncModal";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { getAvailablePlugins, getEntityPlugin } from "@catalog";
import { REPOSITORY_FAMILY } from "@app/queries/utils/families";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useEntityDelete } from "@app/hooks/useEntityDelete";
import { withId } from "@app/models/models";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

type RepositoryRow = RepositoryResponse;

const COLUMN_KEYS = [
  "name",
  "description",
  "type",
  "remote",
  "actions",
] as const;
type RepositoryColumnKey = (typeof COLUMN_KEYS)[number];

interface IRepositoryFilters {
  name: string;
  pulp_type: string;
}

const truncate = (value: string | null | undefined, max = 40): string => {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

export const RepositoryList: React.FC = () => {
  const [deleteTarget, setDeleteTarget] = useState<RepositoryRow | null>(null);
  // Single source of truth for the create/edit modal: "create", a row to edit,
  // or null (closed) — so create and edit can never be open at once.
  const [modalState, setModalState] = useState<"create" | RepositoryRow | null>(
    null,
  );
  const [syncTarget, setSyncTarget] = useState<RepositoryRow | null>(null);
  const [publishTarget, setPublishTarget] = useState<RepositoryRow | null>(
    null,
  );

  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const { deleteEntity, isDeleting } = useEntityDelete(REPOSITORY_FAMILY);
  const { name: pulpDomain } = useSelectedDomain();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "name", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRepositoryFilters>({
      initialFilters: { name: "", pulp_type: "" },
    });
  const debouncedName = useDebouncedValue(filters.name);
  const debouncedPulpType = useDebouncedValue(filters.pulp_type);

  const ordering = toOrderingParam(sortBy, direction) as
    "name" | "-name" | "description" | "-description";

  const { data, isLoading, error } = useRepositoriesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
    pulp_type: debouncedPulpType
      ? (debouncedPulpType as NonNullable<
          Parameters<typeof useRepositoriesListQuery>[0]
        >["pulp_type"])
      : undefined,
  });

  const repositories = (data?.results ?? []) as RepositoryRow[];
  const totalCount = data?.count ?? 0;

  const canCreate = getAvailablePlugins("repository", plugins).length > 0;

  const sortProps = (columnKey: RepositoryColumnKey) =>
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
    { cell: "Description", props: { sort: sortProps("description") } },
    "Type",
    "Remote",
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = repositories.map((repository) => {
    const repoId = extractIdFromHref(repository.pulp_href ?? "");
    const pulpType = resolvePulpType(repository.pulp_href);
    const plugin = pulpType
      ? getEntityPlugin("repository", pulpType)
      : undefined;

    const actionItems: IAction[] = [
      {
        title: "Edit",
        onClick: () => setModalState(repository),
      },
    ];
    if (plugin && plugin.compatibleRemoteTypes.length > 0) {
      actionItems.push({
        title: "Sync",
        onClick: () => setSyncTarget(repository),
      });
    }
    if (plugin && plugin.compatiblePublicationTypes.length > 0) {
      actionItems.push({
        title: "Publish",
        onClick: () => setPublishTarget(repository),
      });
    }
    actionItems.push({
      title: "Delete",
      onClick: () => setDeleteTarget(repository),
    });

    return {
      id: repository.pulp_href,
      row: [
        {
          cell: repoId ? (
            <Link
              to="/content-management/$pulpDomain/repositories/$repoId"
              params={{ pulpDomain, repoId }}
            >
              {repository.name}
            </Link>
          ) : (
            repository.name
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: truncate(repository.description),
          props: { dataLabel: "Description" },
        },
        {
          cell: pulpType ? (
            <PulpTypeLabel kind="repository" pulpType={pulpType} />
          ) : (
            "—"
          ),
          props: { dataLabel: "Type" },
        },
        {
          cell: truncate(repository.remote),
          props: { dataLabel: "Remote" },
        },
        {
          cell: <ActionsColumn items={actionItems} />,
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: repositories.length === 0,
    emptyState: (
      <TableEmptyState
        title="No repositories found"
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
      <DocumentTitle title="Repositories" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Repositories</Content>

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
                  Create repository
                </Button>
              ) : undefined
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Repositories table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <EntityModal
          config={REPOSITORY_FAMILY}
          isOpen={modalState !== null}
          entity={
            modalState === "create" ? undefined : (modalState ?? undefined)
          }
          onClose={() => setModalState(null)}
        />

        {syncTarget && (
          <SyncModal
            isOpen
            onClose={() => setSyncTarget(null)}
            repo={withId(
              extractIdFromHref(syncTarget.pulp_href ?? ""),
              syncTarget,
            )}
          />
        )}

        {publishTarget && (
          <PublishModal
            isOpen
            onClose={() => setPublishTarget(null)}
            repoHref={publishTarget.pulp_href ?? ""}
          />
        )}

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Repository"
          body={`Are you sure you want to delete repository "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};
