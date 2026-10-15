import type React from "react";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
  PaginationVariant,
  Tooltip,
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
import { ActionsColumn, type IAction } from "@patternfly/react-table";

import type { RepositoryResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { RepositoryModal } from "./components/RepositoryModal";
import { useRepositoryActions } from "./hooks/useRepositoryActions";
import { EntityTaskStatus } from "@app/components/EntityTaskStatus";
import { PublishModal } from "@app/components/PublishModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { SyncModal } from "@app/components/SyncModal";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/context/useNotifications";
import { useCreatablePlugins } from "@app/hooks/pluginForm/useCreatablePlugins";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import { withId } from "@app/models/models";
import type { IRepositoryListParams } from "@app/queries/repositories";
import {
  repositoryKeys,
  useRepositoriesListQuery,
} from "@app/queries/repositories";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { getPlugin } from "@catalog";

const SORTABLE_COLUMN_KEYS = [
  "name",
  "description",
] as const satisfies readonly OrderingField<IRepositoryListParams>[];

interface IRepositoryFilters {
  name: IRepositoryListParams["name"];
  pulp_type: IRepositoryListParams["pulp_type"];
}

export const RepositoryList: React.FC = () => {
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const [modalState, setModalState] = useState<
    "create" | RepositoryResponse | null
  >(null);
  const repositoryToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);

  const [deleteTarget, setDeleteTarget] = useState<RepositoryResponse | null>(
    null,
  );
  const [syncTarget, setSyncTarget] = useState<RepositoryResponse | null>(null);
  const [publishTarget, setPublishTarget] = useState<RepositoryResponse | null>(
    null,
  );

  const canCreate = useCreatablePlugins("repository").length > 0;
  const { deleteRepository, isDeleting } = useRepositoryActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRepositoryFilters>({});
  const debouncedName = useDebouncedValue(filters.name);
  const debouncedPulpType = useDebouncedValue(filters.pulp_type);

  const { data, isLoading, error } = useRepositoriesListQuery({
    params: {
      limit: perPage,
      offset: (page - 1) * perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      pulp_type: debouncedPulpType || undefined,
    },
  });

  const repositories = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const { getTaskKind } = useResourceTasks({
    entities: repositories,
    onSettled: ({ entity, kind, state }) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      if (state) {
        addNotification({
          title: `Failed to ${kind} repository "${entity.name}"`,
          variant: "danger",
        });
      }
    },
  });

  const columns: DataViewTh[] = [
    {
      cell: "Name",
      props: {
        sort: sortProps("name"),
        width: 25,
      },
    },
    {
      cell: "Description",
      props: {
        sort: sortProps("description"),
        width: 35,
      },
    },
    {
      cell: "Type",
      props: {
        width: 20,
      },
    },
    {
      cell: "Remote",
      props: {
        width: 20,
      },
    },
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = repositories.map((repository) => {
    const taskKind = getTaskKind(repository.prn);
    const pulpType = resolvePulpType(repository.pulp_href);
    const repo = pulpType
      ? getPlugin(pulpType)?.entities.repository
      : undefined;
    const canEdit = !!repo;
    const canSync = (repo?.compatibleRemoteTypes.length ?? 0) > 0;
    const canPublish = (repo?.compatiblePublicationTypes.length ?? 0) > 0;

    const actionItems: IAction[] = [
      {
        title: "Edit",
        isAriaDisabled: !canEdit,
        tooltipProps: canEdit
          ? undefined
          : {
              content:
                "This repository's plugin type isn't available in the UI.",
            },
        onClick: () => setModalState(repository),
      },
    ];
    if (canSync) {
      actionItems.push({
        title: "Sync",
        onClick: () => setSyncTarget(repository),
      });
    }
    if (canPublish) {
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
          cell: repository.name,
          props: { dataLabel: "Name" },
        },
        {
          cell: repository.description || "—",
          props: { dataLabel: "Description", modifier: "truncate" },
        },
        {
          cell: pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: repository.remote || "—",
          props: { dataLabel: "Remote", modifier: "truncate" },
        },
        {
          cell: taskKind ? (
            <EntityTaskStatus kind={taskKind} />
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
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    try {
      // Wait for the 202 (task accepted) before closing; the row then shows "Deleting".
      await deleteRepository(target);
      setDeleteTarget(null);
    } catch {
      // Error surfaced as a toast; keep the modal open.
    }
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
              ) : (
                <Tooltip content="No repository plugin is available. Install a content plugin (e.g. pulp_file) to create repositories.">
                  <Button variant="primary" isAriaDisabled>
                    Create repository
                  </Button>
                </Tooltip>
              )
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
          isOpen={modalState !== null}
          entity={repositoryToEdit}
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
