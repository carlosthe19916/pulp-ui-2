import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Pagination,
  Select,
  SelectList,
  SelectOption,
  ToolbarItem,
  MenuToggle,
  type MenuToggleElement,
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

import {
  computeActiveState,
  dataViewBodyStates,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import {
  type TaskState,
  useTaskCancelMutation,
  useTaskPurgeMutation,
  useTasksListQuery,
} from "@app/queries/tasks";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractTaskId } from "@app/utils/taskHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

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

function getTaskName(name: string): string {
  const parts = name.split(".");
  return parts[parts.length - 1] ?? name;
}

function isCancelable(state?: string | null) {
  return state === "running" || state === "waiting";
}

interface ITaskFilters {
  name: string;
}

export const TaskList: React.FC = () => {
  const [stateFilter, setStateFilter] = useState<TaskState | "">("");
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [cancelHref, setCancelHref] = useState<string | null>(null);

  const { addNotification } = useNotifications();
  const cancelMutation = useTaskCancelMutation();
  const purgeMutation = useTaskPurgeMutation();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<ITaskFilters>({ initialFilters: { name: "" } });

  const { data, isLoading, error } = useTasksListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering: "-pulp_created",
    name__contains: filters.name || undefined,
    state: stateFilter || undefined,
  });

  const tasks = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = [
    "Name",
    "State",
    "Started",
    "Finished",
    { cell: "", props: { screenReaderText: "Actions" } },
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
            <Button
              variant="link"
              isInline
              onClick={() => setCancelHref(task.pulp_href ?? null)}
            >
              Cancel
            </Button>
          ) : (
            "—"
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const activeState = computeActiveState({
    isLoading,
    isError: !!error,
    isEmpty: tasks.length === 0,
  });

  const pagination = (
    <Pagination
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
    if (!cancelHref) return;
    try {
      await cancelMutation.mutateAsync(cancelHref);
      addNotification({
        title: "Task cancel requested",
        variant: "info",
      });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to cancel task"),
        variant: "danger",
      });
    }
    setCancelHref(null);
  };

  const handlePurge = async () => {
    try {
      const result = await purgeMutation.mutateAsync({
        states: ["completed", "failed", "canceled", "skipped"],
      });
      const taskHref = result?.task;
      if (taskHref) {
        notifyTaskStarted(addNotification, taskHref, "Purge task started");
      } else {
        addNotification({
          title: "Purge requested",
          variant: "info",
        });
      }
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to purge tasks"),
        variant: "danger",
      });
    }
    setIsPurgeOpen(false);
  };

  return (
    <>
      <DocumentTitle title="Tasks" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Tasks</Content>

          <DataView activeState={activeState}>
            <DataViewToolbar
              clearAllFilters={clearAllFilters}
              filters={
                <>
                  <DataViewFilters
                    onChange={(_key, newFilters) => onSetFilters(newFilters)}
                    values={filters}
                  >
                    <DataViewTextFilter filterId="name" title="Name" />
                  </DataViewFilters>
                  {stateSelect}
                </>
              }
              actions={
                <Button
                  variant="secondary"
                  onClick={() => setIsPurgeOpen(true)}
                >
                  Purge tasks
                </Button>
              }
              pagination={pagination}
            />

            <DataViewTable
              aria-label="Tasks table"
              columns={columns}
              rows={rows}
              bodyStates={dataViewBodyStates({ empty: "No tasks found." })}
            />

            <DataViewToolbar pagination={pagination} />
          </DataView>

          <Modal
            isOpen={!!cancelHref}
            onClose={() => setCancelHref(null)}
            variant="small"
          >
            <ModalHeader title="Cancel Task" />
            <ModalBody>Are you sure you want to cancel this task?</ModalBody>
            <ModalFooter>
              <Button
                variant="danger"
                onClick={() => void handleCancel()}
                isLoading={cancelMutation.isPending}
              >
                Cancel Task
              </Button>
              <Button variant="link" onClick={() => setCancelHref(null)}>
                Close
              </Button>
            </ModalFooter>
          </Modal>

          <Modal
            isOpen={isPurgeOpen}
            onClose={() => setIsPurgeOpen(false)}
            variant="small"
          >
            <ModalHeader title="Purge Tasks" />
            <ModalBody>
              Purge completed, failed, canceled, and skipped tasks? This starts
              an asynchronous purge task.
            </ModalBody>
            <ModalFooter>
              <Button
                variant="danger"
                onClick={() => void handlePurge()}
                isLoading={purgeMutation.isPending}
              >
                Purge
              </Button>
              <Button variant="link" onClick={() => setIsPurgeOpen(false)}>
                Close
              </Button>
            </ModalFooter>
          </Modal>
        </PageSection>
      )}
    </>
  );
};
