import type React from "react";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Label,
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
  type DataViewTr,
  type ExpandableContent,
} from "@patternfly/react-data-view";
import { ActionsColumn, type IAction } from "@patternfly/react-table";

import type { RepositoryResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { MultiSelectFilter } from "@app/components/MultiSelectFilter";
import { PublishModal } from "@app/components/PublishModal";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { resourceTaskExpansions } from "@app/components/resourceTaskExpansions";
import { ResourceTaskStatus } from "@app/components/ResourceTaskStatus";
import { SyncModal } from "@app/components/SyncModal";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useCreatableTypes } from "@app/hooks/useCreatableTypes";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  repositoryKeys,
  useRepositoriesListQuery,
  useRepositoryDeleteMutation,
} from "@app/queries/repositories";
import {
  extractIdFromHref,
  hasRoleEndpoints,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getAvailableTypes, getPulpType } from "@catalog";
import { getEntityForm, getTypeLabel } from "@plugins";

import {
  REPOSITORY_LIST_STATE,
  SORTABLE_COLUMN_KEYS,
} from "./repositoryListState";

export const RepositoryList: React.FC = () => {
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const { name: pulpDomain } = useSelectedDomain();
  const installed = useApiStatus().plugins;
  const typeOptions = getAvailableTypes({
    entity: "repository",
    installed,
  }).map(({ pulpType }) => ({
    value: pulpType,
    label: getTypeLabel({ entity: "repository", pulpType }),
  }));

  const [deleteTarget, setDeleteTarget] = useState<RepositoryResponse | null>(
    null,
  );
  const [syncTarget, setSyncTarget] = useState<RepositoryResponse | null>(null);
  const [publishTarget, setPublishTarget] = useState<RepositoryResponse | null>(
    null,
  );

  const canCreate = useCreatableTypes("repository").length > 0;
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

  const [pagination, setPagination] = usePersistentState({
    ...REPOSITORY_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...REPOSITORY_LIST_STATE.sort,
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
    ...REPOSITORY_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(REPOSITORY_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useRepositoriesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      pulp_type__in: filters.pulp_type.length ? filters.pulp_type : undefined,
    },
  });

  const repositories = data?.results ?? [];
  usePageInRange({ pagination, setPagination, count: data?.count });
  const { disabledProps } = useObjectsPermissions({
    hrefs: repositories
      .filter((repository) => hasRoleEndpoints(repository.pulp_href))
      .map((repository) => repository.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;

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

  // Status is task-driven: show the column only when a repository actually has an in-flight
  // task, so it isn't a column of dashes.
  const hasAnyActiveTask = repositories.some(
    (repository) => getActiveCount(repository.prn) > 0,
  );

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
        width: 30,
      },
    },
    {
      cell: "Type",
      props: {
        width: 15,
      },
    },
    {
      cell: "Remote",
      props: {
        width: 20,
      },
    },
    ...(hasAnyActiveTask
      ? [{ cell: "Status", props: { width: 10 } } satisfies DataViewTh]
      : []),
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
      ? getPulpType(pulpType)?.entities.repository
      : undefined;
    const canEdit = !!(
      pulpType &&
      getEntityForm({ entity: "repository", pulpType, mode: "edit" })
    );
    const canSync = (repo?.compatibleRemoteTypes.length ?? 0) > 0;
    const canPublish = (repo?.compatiblePublicationTypes.length ?? 0) > 0;

    const actionItems: IAction[] = [
      {
        title: "Edit",
        onClick: () =>
          pulpType &&
          void navigate({
            to: "/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/edit",
            params: {
              pulpDomain,
              repositoryType: pulpType,
              repositoryId: extractIdFromHref(repository.pulp_href ?? ""),
            },
          }),
        ...(canEdit
          ? disabledProps({ href: repository.pulp_href, verb: "change" })
          : {
              isAriaDisabled: true,
              tooltipProps: {
                content:
                  "This repository's plugin type isn't available in the UI.",
              },
            }),
      },
    ];
    if (canSync) {
      actionItems.push({
        title: "Sync",
        onClick: () => setSyncTarget(repository),
        ...disabledProps({ href: repository.pulp_href, verb: "sync" }),
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
      ...disabledProps({ href: repository.pulp_href, verb: "delete" }),
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
          cell: pulpType ? <Label color="blue">{pulpType}</Label> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: repository.remote || "—",
          props: { dataLabel: "Remote", modifier: "truncate" },
        },
        ...(hasAnyActiveTask
          ? [
              {
                cell: (
                  <ResourceTaskStatus
                    count={getActiveCount(repository.prn)}
                    kind={getTaskKinds(repository.prn)[0]}
                  />
                ),
                props: { dataLabel: "Status" },
              },
            ]
          : []),
        {
          cell: <ActionsColumn items={actionItems} />,
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const STATUS_COLUMN_INDEX = 4;
  const expandedRows: ExpandableContent[] = hasAnyActiveTask
    ? resourceTaskExpansions({
        entities: repositories,
        getActiveCount,
        statusColumnIndex: STATUS_COLUMN_INDEX,
      })
    : [];

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: repositories.length === 0,
    emptyState: (
      <TableEmptyState
        title="No repositories found"
        isFiltered={Boolean(debouncedName) || filters.pulp_type.length > 0}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    deleteMutation.mutate(target, { onSuccess: () => setDeleteTarget(null) });
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
                  setFilters((prev) => ({ ...prev, ...newFilters }));
                  toFirstPage();
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Name" />
                <MultiSelectFilter
                  filterId="pulp_type"
                  title="Type"
                  options={typeOptions}
                />
              </DataViewFilters>
            }
            actions={
              canCreate ? (
                <Button
                  variant="primary"
                  onClick={() =>
                    void navigate({
                      to: "/content-management/$pulpDomain/repositories/create",
                      params: { pulpDomain },
                    })
                  }
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
                onPaginationChange={setPagination}
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
                onPaginationChange={setPagination}
              />
            }
          />
        </DataView>

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
