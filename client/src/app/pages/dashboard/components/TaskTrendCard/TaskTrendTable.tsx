import type React from "react";

import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

export interface ITrendDay {
  label: string;
  completed: number;
  failed: number;
}

interface ITaskTrendTableProps {
  days: ITrendDay[];
}

/** The trend's numbers as a table, for screen readers and exact values. */
export const TaskTrendTable: React.FC<ITaskTrendTableProps> = ({ days }) => (
  <Table aria-label="Tasks finished per day" variant="compact">
    <Thead>
      <Tr>
        <Th>Day</Th>
        <Th>Completed</Th>
        <Th>Failed</Th>
      </Tr>
    </Thead>
    <Tbody>
      {days.map((day) => (
        <Tr key={day.label}>
          <Td dataLabel="Day">{day.label}</Td>
          <Td dataLabel="Completed">{day.completed}</Td>
          <Td dataLabel="Failed">{day.failed}</Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);
