import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Label,
  PageSection,
  Pagination,
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
  useDataViewSort,
  type DataViewTr,
} from "@patternfly/react-data-view";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { type TaskState, useTasksListQuery } from "@app/queries/tasks";
import { extractTaskId } from "@app/utils/taskHref";
import { formatDateTime } from "@app/utils/utils";

import { useTaskActions } from "./hooks/useTaskActions";

const stateColors: Record<
  string,
  "green" | "blue" | "red" | "orange" | "grey" | "teal"
> = {
  completed: "green",
  running: "blue",
  failed: "red",
  canceled: "orange",
  canceling: "orange",
  waiting: "teal",
  skipped: "grey",
};

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

const getTaskName = (name: string): string => {
  const parts = name.split(".");
  return parts[parts.length - 1] ?? name;
};

const isCancelable = (state?: string | null) => {
  return state === "running" || state === "waiting";
};

const COLUMN_KEYS = [
  "name",
  "state",
  "started_at",
  "finished_at",
  "actions",
] as const;
type TaskColumnKey = (typeof COLUMN_KEYS)[number];

interface ITaskFilters {
  name: string;
}

export const TaskList: React.FC = () => {
  const [stateFilter, setStateFilter] = useState<TaskState | "">("");
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [cancelTaskId, setCancelTaskId] = useState<string | null>(null);

  const { cancelTask, purgeTasks, isCanceling, isPurging } = useTaskActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "pulp_created", direction: "desc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<ITaskFilters>({ initialFilters: { name: "" } });
  const debouncedName = useDebouncedValue(filters.name);

  const ordering = toOrderingParam(sortBy, direction) as NonNullable<
    Parameters<typeof useTasksListQuery>[0]
  >["ordering"];

  const { data, isLoading, error } = useTasksListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__contains: debouncedName || undefined,
    state: stateFilter || undefined,
  });

  const tasks = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const sortProps = (columnKey: TaskColumnKey) =>
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
    { cell: "State", props: { sort: sortProps("state") } },
    { cell: "Started", props: { sort: sortProps("started_at") } },
    { cell: "Finished", props: { sort: sortProps("finished_at") } },
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
              {getTaskName(task.name)}
            </Link>
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: (
            <Label color={stateColors[task.state ?? ""] ?? "grey"} isCompact>
              {task.state}
            </Label>
          ),
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
                  onClick: () =>
                    setCancelTaskId(extractTaskId(task.pulp_href ?? "")),
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
    loading: isLoading,
    error,
    empty: tasks.length === 0,
    emptyState: (
      <TableEmptyState
        title="No tasks found"
        isFiltered={Boolean(debouncedName)}
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

  const handleCancel = async () => {
    if (!cancelTaskId) return;
    try {
      await cancelTask(cancelTaskId);
    } catch {
      // Notifications are handled in useTaskActions.
    }
    setCancelTaskId(null);
  };

  const handlePurge = async () => {
    try {
      await purgeTasks();
    } catch {
      // Notifications are handled in useTaskActions.
    }
    setIsPurgeOpen(false);
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
                    onSetPage(undefined, 1);
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
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Tasks table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <ConfirmActionModal
          isOpen={!!cancelTaskId}
          title="Cancel Task"
          body="Are you sure you want to cancel this task?"
          isConfirming={isCanceling}
          confirmLabel="Cancel Task"
          cancelLabel="Close"
          confirmVariant="primary"
          onConfirm={() => void handleCancel()}
          onCancel={() => setCancelTaskId(null)}
        />

        <ConfirmActionModal
          isOpen={isPurgeOpen}
          title="Purge Tasks"
          body="Purge completed, failed, canceled, and skipped tasks? This starts an asynchronous purge task."
          isConfirming={isPurging}
          confirmLabel="Purge"
          cancelLabel="Close"
          confirmVariant="primary"
          onConfirm={() => void handlePurge()}
          onCancel={() => setIsPurgeOpen(false)}
        />
      </PageSection>
    </>
  );
};
