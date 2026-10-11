import { createContext } from "react";

import type { EntityTaskKind } from "@app/components/EntityTaskStatus";

export interface IEntityTask {
  kind: EntityTaskKind;
  taskHref: string;
}

export interface IEntityTaskTracker {
  tasksById: Record<string, IEntityTask>;
  track: (id: string, task: IEntityTask) => void;
  untrack: (id: string) => void;
}

/**
 * One shared tracker for in-flight async tasks (delete/update), keyed by entity id
 * and reused by every list that tracks them (remotes, repositories, distributions,
 * domains). A provider is mounted per list, so each list owns its own task map.
 */
export const EntityTaskTrackerContext = createContext<IEntityTaskTracker>({
  tasksById: {},
  track: () => {},
  untrack: () => {},
});
