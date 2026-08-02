import type React from "react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import dayjs from "dayjs";

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
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  MenuToggle,
  type MenuToggleElement,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { TaskResponse } from "@app/client";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { RENDER_DATETIME_FORMAT } from "@app/Constants";
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
import { getMutationErrorMessage } from "@app/utils/utils";

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

export const TaskList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");
  const [stateFilter, setStateFilter] = useState<TaskState | "">("");
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [cancelHref, setCancelHref] = useState<string | null>(null);

  const { addNotification } = useNotifications();
  const cancelMutation = useTaskCancelMutation();
  const purgeMutation = useTaskPurgeMutation();

  const { data, isLoading, error } = useTasksListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering: "-pulp_created",
    name__contains: nameFilter || undefined,
    state: stateFilter || undefined,
  });

  const tasks = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = useMemo<ColumnDef<TaskResponse>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const taskId = extractTaskId(row.original.pulp_href ?? "");
          return (
            <Link to="/tasks/$taskId" params={{ taskId }}>
              {getTaskName(row.original.name)}
            </Link>
          );
        },
      },
      {
        id: "state",
        header: "State",
        cell: ({ row }) => (
          <Label
            color={stateColors[row.original.state ?? ""] ?? "grey"}
            isCompact
          >
            {row.original.state}
          </Label>
        ),
      },
      {
        id: "started",
        header: "Started",
        cell: ({ row }) =>
          row.original.started_at
            ? dayjs(row.original.started_at).format(RENDER_DATETIME_FORMAT)
            : "—",
      },
      {
        id: "finished",
        header: "Finished",
        cell: ({ row }) =>
          row.original.finished_at
            ? dayjs(row.original.finished_at).format(RENDER_DATETIME_FORMAT)
            : "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          isCancelable(row.original.state) ? (
            <Button
              variant="link"
              isInline
              onClick={() => setCancelHref(row.original.pulp_href ?? null)}
            >
              Cancel
            </Button>
          ) : (
            "—"
          ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

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

          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  placeholder="Filter by name..."
                  value={nameFilter}
                  onChange={(_e, value) => {
                    setNameFilter(value);
                    setPage(1);
                  }}
                  onClear={() => {
                    setNameFilter("");
                    setPage(1);
                  }}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Select
                  isOpen={isStateOpen}
                  selected={stateFilter}
                  onSelect={(_e, value) => {
                    setStateFilter((value as TaskState | "") ?? "");
                    setPage(1);
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
              <ToolbarItem>
                <Button
                  variant="secondary"
                  onClick={() => setIsPurgeOpen(true)}
                >
                  Purge tasks
                </Button>
              </ToolbarItem>
              <ToolbarItem variant="pagination">
                <Pagination
                  itemCount={totalCount}
                  perPage={perPage}
                  page={page}
                  onSetPage={(_e, p) => setPage(p)}
                  onPerPageSelect={(_e, pp) => {
                    setPerPage(pp);
                    setPage(1);
                  }}
                  isCompact
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {isLoading ? (
            <Spinner aria-label="Loading tasks" />
          ) : (
            <Table aria-label="Tasks table" variant="compact">
              <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody>
                {table.getRowModel().rows.map((row) => (
                  <Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Td>
                    ))}
                  </Tr>
                ))}
                {tasks.length === 0 && (
                  <Tr>
                    <Td colSpan={columns.length}>No tasks found.</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}

          <Pagination
            itemCount={totalCount}
            perPage={perPage}
            page={page}
            onSetPage={(_e, p) => setPage(p)}
            onPerPageSelect={(_e, pp) => {
              setPerPage(pp);
              setPage(1);
            }}
            variant="bottom"
          />

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
