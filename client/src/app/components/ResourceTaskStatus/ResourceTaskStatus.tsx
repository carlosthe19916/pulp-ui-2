import type React from "react";

import type { EntityTaskKind } from "@app/hooks/useResourceTasks";

import { EntityTaskStatus } from "./EntityTaskStatus";
import { ResourceTaskCountToggle } from "./ResourceTaskCountToggle";

interface IResourceTaskStatusProps {
  count: number;
  kind?: EntityTaskKind;
}

/**
 * A row's task-status cell by active-task count: `—`, the single task (spinner + kind),
 * or a 2+ count badge.
 */
export const ResourceTaskStatus: React.FC<IResourceTaskStatusProps> = ({
  count,
  kind,
}) => {
  if (count === 0) return "—";
  if (count === 1) return <EntityTaskStatus kind={kind} />;
  return <ResourceTaskCountToggle count={count} />;
};
