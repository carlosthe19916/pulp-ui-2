import type React from "react";

import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";

import {
  Button,
  Flex,
  FlexItem,
  Pagination,
  PaginationVariant,
  Tooltip,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
  useDataViewPagination,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { TaskStateLabel } from "@app/components/TaskStateLabel";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  isTerminalTaskState,
  PRN_TASK_STATES,
  useTaskCancelMutation,
  useTasksListQuery,
} from "@app/queries/tasks";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { extractTaskDomain, extractTaskId } from "@app/utils/taskHref";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

/** Operation label from a Pulp task name. */
const actionLabel = (name?: string | null): string => {
  const taskName = name ?? "";
  if (taskName.includes("general_delete")) return "Delete";
  if (taskName.includes("general_update")) return "Update";
  return "Task";
};

interface IResourceTaskTableProps {
  prn: string;
}

/**
 * Expanded content for a row's task cell: the full, paginated task list for the
 * resource (active + recent failures), each linkable to its detail and cancelable.
 */
export const ResourceTaskTable: React.FC<IResourceTaskTableProps> = ({
  prn,
}) => {
  const { addNotification } = useNotifications();
  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 5,
  });
  const { data, isLoading, error } = useTasksListQuery({
    params: {
      reserved_resources: prn,
      state__in: [...PRN_TASK_STATES],
      fields: [
        "pulp_href",
        "name",
        "state",
        "pulp_created",
        "reserved_resources_record",
      ],
      ordering: "-pulp_created",
      limit: perPage,
      offset: (page - 1) * perPage,
    },
    options: { enabled: !!prn },
  });
  const cancelMutation = useTaskCancelMutation({
    onSuccess: () =>
      addNotification({
        title: "Task cancellation requested",
        variant: "info",
      }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: "Failed to cancel task",
        }),
        variant: "danger",
      }),
  });

  const tasks = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Action" },
    { cell: "State" },
    { cell: "Created" },
    { cell: "", props: { screenReaderText: "Task actions" } },
  ];

  const rows: DataViewTr[] = tasks.map((task) => {
    const taskHref = task.pulp_href ?? "";
    const taskId = extractTaskId(taskHref);
    const pulpDomain = extractTaskDomain(taskHref);
    const isActive = !isTerminalTaskState(task.state);
    return {
      id: task.pulp_href,
      row: [
        { cell: actionLabel(task.name), props: { dataLabel: "Action" } },
        {
          cell: <TaskStateLabel state={task.state} isCompact />,
          props: { dataLabel: "State" },
        },
        {
          cell: task.pulp_created ? (
            <Tooltip content={formatDateTime(task.pulp_created) ?? ""}>
              <span>{dayjs.utc(task.pulp_created).fromNow()}</span>
            </Tooltip>
          ) : (
            "—"
          ),
          props: { dataLabel: "Created" },
        },
        {
          cell: (
            <Flex
              spaceItems={{ default: "spaceItemsSm" }}
              flexWrap={{ default: "nowrap" }}
            >
              <FlexItem>
                <Link
                  to="/monitoring/$pulpDomain/tasks/$taskId"
                  params={{ pulpDomain, taskId }}
                >
                  Detail
                </Link>
              </FlexItem>
              {isActive && (
                <FlexItem>
                  <Button
                    variant="link"
                    isInline
                    isDisabled={cancelMutation.isPending}
                    onClick={() =>
                      task.pulp_href && cancelMutation.mutate(task.pulp_href)
                    }
                  >
                    Cancel
                  </Button>
                </FlexItem>
              )}
            </Flex>
          ),
          props: { dataLabel: "Task actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: tasks.length === 0,
    emptyState: "No tasks found for this resource.",
  });

  return (
    <DataView activeState={activeState}>
      <DataViewTable
        aria-label="Resource tasks table"
        columns={columns}
        rows={rows}
        bodyStates={bodyStates}
      />
      <DataViewToolbar
        pagination={
          <Pagination
            variant={PaginationVariant.bottom}
            isCompact
            itemCount={totalCount}
            page={page}
            perPage={perPage}
            perPageOptions={[
              { title: "5", value: 5 },
              { title: "10", value: 10 },
            ]}
            onSetPage={onSetPage}
            onPerPageSelect={onPerPageSelect}
          />
        }
      />
    </DataView>
  );
};
