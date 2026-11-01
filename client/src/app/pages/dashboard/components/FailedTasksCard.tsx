import type React from "react";

import { Link } from "@tanstack/react-router";

import { PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useTasksListQuery } from "@app/queries/tasks";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { PAGINATION_STATE } from "@app/utils/listState";
import { extractTaskId, shortTaskName } from "@app/utils/taskHref";
import { formatDateTime, getTaskErrorMessage } from "@app/utils/utils";

import { DashboardCard } from "./DashboardCard";

/** Failed tasks in the domain, newest first, with their error. */
export const FailedTasksCard: React.FC = () => {
  const { name: pulpDomain } = useSelectedDomain();
  const [pagination, setPagination] = usePersistentState({
    ...PAGINATION_STATE,
    storage: "state",
  });

  const { data, isLoading, error } = useTasksListQuery({
    params: {
      state: "failed",
      ordering: "-finished_at",
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      fields: ["pulp_href", "name", "finished_at", "error"],
    },
  });
  const tasks = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Task", props: { width: 30 } },
    { cell: "Finished", props: { width: 25 } },
    { cell: "Error", props: { width: 45 } },
  ];

  const rows: DataViewTr[] = tasks.map((task) => ({
    id: task.pulp_href,
    row: [
      {
        cell: task.pulp_href ? (
          <Link
            to="/monitoring/$pulpDomain/tasks/$taskId"
            params={{ pulpDomain, taskId: extractTaskId(task.pulp_href) }}
          >
            {shortTaskName(task.name)}
          </Link>
        ) : (
          shortTaskName(task.name)
        ),
        props: { dataLabel: "Task" },
      },
      {
        cell: formatDateTime(task.finished_at) ?? "—",
        props: { dataLabel: "Finished" },
      },
      {
        cell: getTaskErrorMessage(task) ?? "—",
        props: { dataLabel: "Error", modifier: "truncate" },
      },
    ],
  }));

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: tasks.length === 0,
    emptyState: <TableEmptyState title="No failed tasks" />,
  });

  return (
    <DashboardCard
      title="Recent failed tasks"
      footer={
        <Link
          to="/monitoring/$pulpDomain/tasks"
          params={{ pulpDomain }}
          search={{ state: ["failed"] }}
        >
          View failed tasks
        </Link>
      }
    >
      <DataView activeState={activeState}>
        <DataViewTable
          aria-label="Recent failed tasks"
          variant="compact"
          columns={columns}
          rows={rows}
          bodyStates={bodyStates}
        />
        {totalCount > pagination.perPage && (
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
        )}
      </DataView>
    </DashboardCard>
  );
};
