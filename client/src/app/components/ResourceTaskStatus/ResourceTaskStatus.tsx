import type React from "react";

import type { EntityTaskKind } from "@app/hooks/useResourceTasks";

import { EntityTaskStatus } from "./EntityTaskStatus";
import { ResourceTaskCountToggle } from "./ResourceTaskCountToggle";

/**
 * A row's task-status cell content, by active-task count: none (`—`), a single
 * labelled task (spinner + kind), or a 2+ count badge. Driven by `useResourceTasks`
 * (`getActiveCount` / `getTaskKinds`) at each list page's Status cell, so the
 * 0 / 1 / 2+ logic lives in one place.
 */
export const ResourceTaskStatus: React.FC<{
  count: number;
  kind?: EntityTaskKind;
}> = ({ count, kind }) => {
  if (count === 0) return "—";
  if (count === 1) return <EntityTaskStatus kind={kind} />;
  return <ResourceTaskCountToggle count={count} />;
};
