import type React from "react";

import { Link } from "@tanstack/react-router";

import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { extractTaskDomain, extractTaskId } from "@app/utils/taskHref";
import { formatDateTime } from "@app/utils/utils";

/** Past exports or imports: when, and the task that ran it. */
export const RunsTable: React.FC<{
  label: string;
  runs: { pulp_href?: string; pulp_created?: string; task?: string | null }[];
  isLoading: boolean;
}> = ({ label, runs, isLoading }) => {
  if (isLoading) return <>Loading…</>;
  if (runs.length === 0) return <>No {label.toLowerCase()} yet.</>;
  return (
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
  );
};
