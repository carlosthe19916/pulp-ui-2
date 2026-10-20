import type React from "react";

import { TasksTable } from "@app/components/TasksTable";

/**
 * Audit tab for a Remote: every task ever triggered against it (all states,
 * including finished). Scoped to the remote via `reserved_resources` and to the
 * remote's domain via `useTasksListQuery`'s selected-domain binding.
 */
export const RemoteTasksTab: React.FC<{ prn: string }> = ({ prn }) => (
  <TasksTable lockedParams={{ reserved_resources: prn }} />
);
