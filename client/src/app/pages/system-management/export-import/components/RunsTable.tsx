import type React from "react";

import { Link } from "@tanstack/react-router";

import { PaginationVariant } from "@patternfly/react-core";
import type { useDataViewPagination } from "@patternfly/react-data-view";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { ListPagination } from "@app/components/ListPagination";
import { extractTaskDomain, extractTaskId } from "@app/utils/taskHref";
import { formatDateTime } from "@app/utils/utils";

interface IRunsTableProps {
  label: string;
  runs: { pulp_href?: string; pulp_created?: string; task?: string | null }[];
  /** Total runs across all pages. */
  count: number;
  pagination: ReturnType<typeof useDataViewPagination>;
  isLoading: boolean;
}

/** Past exports or imports: when, and the task that ran it. */
export const RunsTable: React.FC<IRunsTableProps> = ({
  label,
  runs,
  count,
  pagination,
  isLoading,
}) => {
  if (isLoading) return <>Loading…</>;
  if (runs.length === 0) return <>No {label.toLowerCase()} yet.</>;
  return (
    <>
      <Table aria-label={label} variant="compact">
        <Thead>
          <Tr>
            <Th>Started</Th>
            <Th>Task</Th>
          </Tr>
        </Thead>
        <Tbody>
          {runs.map((run) => (
            <Tr key={run.pulp_href}>
              <Td dataLabel="Started">
                {formatDateTime(run.pulp_created) ?? "—"}
              </Td>
              <Td dataLabel="Task">
                {run.task ? (
                  <Link
                    to="/monitoring/$pulpDomain/tasks/$taskId"
                    params={{
                      pulpDomain: extractTaskDomain(run.task),
                      taskId: extractTaskId(run.task),
                    }}
                  >
                    {extractTaskId(run.task)}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <ListPagination
        variant={PaginationVariant.bottom}
        itemCount={count}
        pagination={pagination}
      />
    </>
  );
};
