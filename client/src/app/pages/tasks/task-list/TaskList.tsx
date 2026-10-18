import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  PaginationVariant,
  Select,
  SelectList,
  SelectOption,
  ToolbarItem,
  MenuToggle,
  type MenuToggleElement,
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
  type DataViewTr,
} from "@patternfly/react-data-view";

import { useNotifications } from "@app/context/useNotifications";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
  ListPagination,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { TaskStateLabel } from "@app/components/TaskStateLabel";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { ITaskListParams } from "@app/queries/tasks";
import {
  isCancelable,
  type TaskState,
  useTaskCancelMutation,
  useTaskPurgeMutation,
  useTasksListQuery,
} from "@app/queries/tasks";
import type { OrderingField } from "@app/queries/utils/listParams";
import { extractTaskId, shortTaskName } from "@app/utils/taskHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

const TASK_STATES: Array<TaskState | ""> = [
  "",
  "waiting",
  "running",
  "completed",
  "failed",
  "canceled",
  "canceling",
  "skipped",
];

const SORTABLE_COLUMN_KEYS = [
  "name",
  "state",
  "started_at",
  "finished_at",
  "pulp_created",
] as const satisfies readonly OrderingField<ITaskListParams>[];

interface ITaskFilters {
  name: ITaskListParams["name"];
}

export const TaskList: React.FC = () => {
  const [stateFilter, setStateFilter] = useState<TaskState | "">("");
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [cancelTaskHref, setCancelTaskHref] = useState<string | null>(null);

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

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "pulp_created", direction: "desc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<ITaskFilters>({});
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useTasksListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__contains: debouncedName || undefined,
      state: stateFilter || undefined,
    },
  });

  const tasks = data?.results ?? [];
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
    const taskId = extractTaskId(task.pulp_href ?? "");
    return {
      id: task.pulp_href,
      row: [
        {
          cell: (
            <Link to="/tasks/$taskId" params={{ taskId }}>
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
    isLoading: isLoading,
    error,
    isEmpty: tasks.length === 0,
    emptyState: (
      <TableEmptyState
        title="No tasks found"
        isFiltered={Boolean(debouncedName)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const stateSelect = (
    <ToolbarItem>
      <Select
        isOpen={isStateOpen}
        selected={stateFilter}
        onSelect={(_e, value) => {
          setStateFilter((value as TaskState | "") ?? "");
          setIsStateOpen(false);
        }}
        onOpenChange={setIsStateOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsStateOpen(!isStateOpen)}
            isExpanded={isStateOpen}
          >
            {stateFilter || "All states"}
          </MenuToggle>
        )}
      >
        <SelectList>
          {TASK_STATES.map((state) => (
            <SelectOption key={state || "all"} value={state}>
              {state || "All states"}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </ToolbarItem>
  );

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
      <DocumentTitle title="Tasks" />
      <PageSection>
        <Content component={ContentVariants.h1}>Tasks</Content>

        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <>
                <DataViewFilters
                  onChange={(_key, newFilters) => {
                    onSetFilters(newFilters);
                    pagination.onSetPage(undefined, 1);
                  }}
                  values={filters}
                >
                  <DataViewTextFilter filterId="name" title="Name" />
                </DataViewFilters>
                {stateSelect}
              </>
            }
            actions={
              <Button variant="secondary" onClick={() => setIsPurgeOpen(true)}>
                Purge tasks
              </Button>
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
      </PageSection>
    </>
  );
};
