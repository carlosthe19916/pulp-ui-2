import type React from "react";

import { TasksTable } from "@app/components/TasksTable";
import { PersistentStateScopeProvider } from "@app/context/PersistentStateScope/PersistentStateScopeProvider";

interface ITaskHistoryTabProps {
  prn: string;
}

/** A detail page's Tasks tab: every task, in any state, that reserved the object. */
export const TaskHistoryTab: React.FC<ITaskHistoryTabProps> = ({ prn }) => (
  <PersistentStateScopeProvider prefix="tasks">
    <TasksTable lockedParams={{ reserved_resources: prn }} />
  </PersistentStateScopeProvider>
);
