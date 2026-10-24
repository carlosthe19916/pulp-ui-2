import type React from "react";

import { TasksTable } from "@app/components/TasksTable";

interface IRemoteTasksTabProps {
  prn: string;
}

/**
 * Audit tab for a remote: every task ever triggered against it (all states), scoped by
 * `reserved_resources`.
 */
export const RemoteTasksTab: React.FC<IRemoteTasksTabProps> = ({ prn }) => (
  <TasksTable lockedParams={{ reserved_resources: prn }} />
);
