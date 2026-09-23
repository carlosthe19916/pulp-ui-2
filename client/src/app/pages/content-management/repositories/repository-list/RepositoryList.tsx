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
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { withId } from "@app/models/models";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

import { RepositoryModal } from "../components/RepositoryModal";
import { useRepositoryActions } from "./hooks/useRepositoryActions";
import { PublishModal } from "@app/components/PublishModal";
import { SyncModal } from "@app/components/SyncModal";

/** The aggregation endpoint returns pulp_type at runtime but the generated type omits it. */
type RepositoryRow = RepositoryResponse & { pulp_type?: string };

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [syncTarget, setSyncTarget] = useState<RepositoryRow | null>(null);
  const [publishRepoHref, setPublishRepoHref] = useState<string | null>(null);

  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const { deleteRepository, isDeleting } = useRepositoryActions();

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

  const canCreate = getDescriptorsForKind("repository").some((d) =>
    d.isAvailable(plugins),
  );

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
    const pulpType = resolvePulpType(
      repository.pulp_type,
      repository.pulp_href,
    );
    const descriptor = pulpType
      ? getDescriptor("repository", pulpType)
      : undefined;

    const actionItems: IAction[] = [];
    if (descriptor?.supportsSync) {
      actionItems.push({
        title: "Sync",
        onClick: () => setSyncTarget(repository),
      });
    }
    if (descriptor?.supportsPublish) {
      actionItems.push({
        title: "Publish",
        onClick: () => setPublishRepoHref(repository.pulp_href ?? null),
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
              to="/content-management/repositories/$repoId"
              params={{ repoId }}
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
          cell: !descriptor ? (
            <ReadOnlyBadge pulpType={pulpType} />
          ) : (
            <ActionsColumn items={actionItems} />
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
      await deleteRepository(deleteTarget);
    } catch {
      // Notifications are handled in useRepositoryActions.
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Repositories" />
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
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
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

        <RepositoryModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
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

        {publishRepoHref && (
          <PublishModal
            isOpen
            onClose={() => setPublishRepoHref(null)}
            repoHref={publishRepoHref}
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
