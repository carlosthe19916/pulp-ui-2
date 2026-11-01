import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { Button, PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { MultiSelectFilter } from "@app/components/MultiSelectFilter";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { TaskStateLabel } from "@app/components/TaskStateLabel";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import type { ITaskListParams } from "@app/queries/tasks";
import {
  isCancelable,
  isTerminalTaskState,
  useTaskCancelMutation,
  useTaskDeleteMutation,
  useTaskPurgeMutation,
  useTasksListQuery,
} from "@app/queries/tasks";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import {
  extractTaskDomain,
  extractTaskId,
  shortTaskName,
} from "@app/utils/taskHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import {
  SORTABLE_COLUMN_KEYS,
  TASK_STATES,
  TASKS_TABLE_STATE,
} from "./tasksTableState";

const STATE_OPTIONS = TASK_STATES.map((state) => ({
  value: state,
  label: state,
}));

interface ITasksTableProps {
  /**
   * Fixed query params merged into every request (e.g.
   * `{ reserved_resources: prn }` to scope the table to one resource). Applied
   * on top of the user-driven filters/sort/pagination.
   */
  lockedParams?: Partial<ITaskListParams>;
  /** Show the Purge action (global Tasks page only). */
  showPurge?: boolean;
}

/**
 * Sortable/filterable tasks table for the selected domain. Renders no `PageSection`, so
 * it also works inside a detail tab.
 */
export const TasksTable: React.FC<ITasksTableProps> = ({
  lockedParams,
  showPurge = false,
}) => {
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [cancelTaskHref, setCancelTaskHref] = useState<string | null>(null);
  const [deleteTaskHref, setDeleteTaskHref] = useState<string | null>(null);

  const { addNotification } = useNotifications();
  const cancelMutation = useTaskCancelMutation({
    onSuccess: () =>
      addNotification({ title: "Task cancel requested", variant: "info" }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: "Failed to cancel task",
        }),
        variant: "danger",
      }),
  });
  const deleteMutation = useTaskDeleteMutation({
    onSuccess: () =>
      addNotification({ title: "Task deleted", variant: "success" }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: "Failed to delete task",
        }),
        variant: "danger",
      }),
  });
  const purgeMutation = useTaskPurgeMutation({
    onSuccess: (data) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: "Purge task started",
      }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: "Failed to purge tasks",
        }),
        variant: "danger",
      }),
  });
  const isCanceling = cancelMutation.isPending;
  const isPurging = purgeMutation.isPending;

  const [pagination, setPagination] = usePersistentState({
    ...TASKS_TABLE_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...TASKS_TABLE_STATE.sort,
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
    ...TASKS_TABLE_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(TASKS_TABLE_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useTasksListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__contains: debouncedName || undefined,
      state__in: filters.state.length ? filters.state : undefined,
      ...lockedParams,
    },
  });

  const tasks = data?.results ?? [];
  usePageInRange({ pagination, setPagination, count: data?.count });

  const { disabledProps } = useObjectsPermissions({
    hrefs: tasks.map((item) => item.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 40 } },
    { cell: "State", props: { sort: sortProps("state"), width: 20 } },
    { cell: "Started", props: { sort: sortProps("started_at"), width: 20 } },
    { cell: "Finished", props: { sort: sortProps("finished_at"), width: 20 } },
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = tasks.map((task) => {
    const taskHref = task.pulp_href ?? "";
    const taskId = extractTaskId(taskHref);
    const pulpDomain = extractTaskDomain(taskHref);
    return {
      id: task.pulp_href,
      row: [
        {
          cell: (
            <Link
              to="/monitoring/$pulpDomain/tasks/$taskId"
              params={{ pulpDomain, taskId }}
            >
              {shortTaskName(task.name)}
            </Link>
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: <TaskStateLabel state={task.state} isCompact />,
          props: { dataLabel: "State" },
        },
        {
          cell: formatDateTime(task.started_at) ?? "—",
          props: { dataLabel: "Started" },
        },
        {
          cell: formatDateTime(task.finished_at) ?? "—",
          props: { dataLabel: "Finished" },
        },
        {
          cell: isCancelable(task.state) ? (
            <ActionsColumn
              items={[
                {
                  title: "Cancel",
                  onClick: () => setCancelTaskHref(task.pulp_href ?? null),
                  ...disabledProps({ href: task.pulp_href, verb: "change" }),
                },
              ]}
            />
          ) : isTerminalTaskState(task.state) ? (
            <ActionsColumn
              items={[
                {
                  title: "Delete",
                  onClick: () => setDeleteTaskHref(task.pulp_href ?? null),
                  ...disabledProps({ href: task.pulp_href, verb: "delete" }),
                },
              ]}
            />
          ) : (
            "—"
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: tasks.length === 0,
    emptyState: (
      <TableEmptyState
        title="No tasks found"
        isFiltered={Boolean(debouncedName) || filters.state.length > 0}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const handleCancel = () => {
    if (!cancelTaskHref) return;
    cancelMutation.mutate(cancelTaskHref, {
      onSettled: () => setCancelTaskHref(null),
    });
  };

  const handlePurge = () => {
    purgeMutation.mutate(
      { states: ["completed", "failed", "canceled", "skipped"] },
      { onSettled: () => setIsPurgeOpen(false) },
    );
  };

  return (
    <>
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
                filterId="state"
                title="State"
                options={STATE_OPTIONS}
              />
            </DataViewFilters>
          }
          actions={
            showPurge ? (
              <Button variant="secondary" onClick={() => setIsPurgeOpen(true)}>
                Purge tasks
              </Button>
            ) : undefined
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
          aria-label="Tasks table"
          columns={columns}
          rows={rows}
          bodyStates={bodyStates}
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

      <ConfirmActionModal
        isOpen={!!cancelTaskHref}
        title="Cancel Task"
        body="Are you sure you want to cancel this task?"
        isConfirming={isCanceling}
        confirmLabel="Cancel Task"
        cancelLabel="Close"
        confirmVariant="primary"
        onConfirm={handleCancel}
        onCancel={() => setCancelTaskHref(null)}
      />

      <ConfirmActionModal
        isOpen={!!deleteTaskHref}
        title="Delete task"
        body="Delete this task's record? This action cannot be undone."
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteTaskHref &&
          deleteMutation.mutate(deleteTaskHref, {
            onSettled: () => setDeleteTaskHref(null),
          })
        }
        onCancel={() => setDeleteTaskHref(null)}
      />

      {showPurge && (
        <ConfirmActionModal
          isOpen={isPurgeOpen}
          title="Purge Tasks"
          body="Purge completed, failed, canceled, and skipped tasks? This starts an asynchronous purge task."
          isConfirming={isPurging}
          confirmLabel="Purge"
          cancelLabel="Close"
          confirmVariant="primary"
          onConfirm={handlePurge}
          onCancel={() => setIsPurgeOpen(false)}
        />
      )}
    </>
  );
};
