import type React from "react";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
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
  ListPagination,
} from "@app/components/DataView";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { resourceTaskExpansions } from "@app/components/resourceTaskExpansions";
import { ResourceTaskStatus } from "@app/components/ResourceTaskStatus";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { RepositoryModal } from "./components/RepositoryModal";
import { PublishModal } from "@app/components/PublishModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { SyncModal } from "@app/components/SyncModal";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/hooks/useNotifications";
import { useCreatablePlugins } from "@app/hooks/pluginForm/useCreatablePlugins";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import type { IRepositoryListParams } from "@app/queries/repositories";
import {
  repositoryKeys,
  useRepositoriesListQuery,
  useRepositoryDeleteMutation,
} from "@app/queries/repositories";
import type { OrderingField } from "@app/queries/utils/listParams";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
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
  const deleteMutation = useRepositoryDeleteMutation({
    onSuccess: (data, { name }) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Repository "${name}" deletion started`,
      }),
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete repository "${name}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRepositoryFilters>({});
  const debouncedName = useDebouncedValue({ value: filters.name });
  const debouncedPulpType = useDebouncedValue({ value: filters.pulp_type });

  const { data, isLoading, error } = useRepositoriesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      pulp_type: debouncedPulpType || undefined,
    },
  });

  const repositories = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const STATUS_COLUMN_INDEX = 4;
  const { getActiveCount, getTaskKinds } = useResourceTasks({
    entities: repositories,
    onSettled: ({ entity }) => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      // Covers the detail page and its versions (a sync adds a version).
      if (entity.pulp_href) {
        void queryClient.invalidateQueries({
          queryKey: repositoryKeys.detail(entity.pulp_href),
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
    { cell: "Status" },
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = repositories.map((repository) => {
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
          cell: (
            <ResourceHrefLink
              kind="repository"
              href={repository.pulp_href}
              label={repository.name}
            />
          ),
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
          cell: (
            <ResourceTaskStatus
              count={getActiveCount(repository.prn)}
              kind={getTaskKinds(repository.prn)[0]}
            />
          ),
          props: { dataLabel: "Status" },
        },
        {
          cell: <ActionsColumn items={actionItems} />,
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const expandedRows = resourceTaskExpansions({
    entities: repositories,
    getActiveCount,
    statusColumnIndex: STATUS_COLUMN_INDEX,
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

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    deleteMutation.mutate(
      { href: target.pulp_href, name: target.name ?? "" },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  return (
    <>
      <DocumentTitle title="Repositories" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Repositories</Content>
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
            pagination={
              <ListPagination
                variant={PaginationVariant.top}
                itemCount={totalCount}
                pagination={pagination}
              />
            }
          />

          <DataViewTable
            aria-label="Repositories table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
            isExpandable={expandedRows.length > 0}
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

        <RepositoryModal
          isOpen={modalState !== null}
          entity={repositoryToEdit}
          onClose={() => setModalState(null)}
        />

        {syncTarget && (
          <SyncModal
            isOpen
            onClose={() => setSyncTarget(null)}
            repository={syncTarget}
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
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};
