import type React from "react";

import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";

import {
  Flex,
  FlexItem,
  PaginationVariant,
  Tooltip,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { GatedButton } from "@app/components/GatedButton";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { TaskStateLabel } from "@app/components/TaskStateLabel";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { usePersistentState } from "@app/hooks/usePersistentState";
import {
  isTerminalTaskState,
  PRN_TASK_STATES,
  useTaskCancelMutation,
  useTasksListQuery,
} from "@app/queries/tasks";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { extractTaskDomain, extractTaskId } from "@app/utils/taskHref";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { RESOURCE_TASK_TABLE_STATE } from "./resourceTaskTableState";

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
  const [pagination, setPagination] = usePersistentState({
    ...RESOURCE_TASK_TABLE_STATE.pagination,
    storage: "state",
  });
  const { page, perPage } = pagination;
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
  const { disabledProps } = useObjectsPermissions({
    hrefs: tasks.map((task) => task.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Action", props: { width: 40 } },
    { cell: "State", props: { width: 30 } },
    { cell: "Created", props: { width: 30 } },
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
                  <GatedButton
                    variant="link"
                    isInline
                    isDisabled={cancelMutation.isPending}
                    onClick={() =>
                      task.pulp_href && cancelMutation.mutate(task.pulp_href)
                    }
                    {...disabledProps({ href: task.pulp_href, verb: "change" })}
                  >
                    Cancel
                  </GatedButton>
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
    emptyState: <TableEmptyState title="No tasks for this resource" />,
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
          <ListPagination
            variant={PaginationVariant.bottom}
            itemCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        }
      />
    </DataView>
  );
};
