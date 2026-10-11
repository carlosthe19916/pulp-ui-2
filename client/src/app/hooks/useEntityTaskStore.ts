import { useCallback, useState } from "react";

import type { EntityTaskKind } from "@app/components/EntityTaskStatus";

export interface IEntityTask {
  kind: EntityTaskKind;
  taskHref: string;
}

/**
 * Holds one list's in-flight task map, keyed by entity id. Split from
 * `useEntityTaskTracker` so the state setter lives in its own module — the
 * watcher's effect then calls `untrack` across a module boundary (not a local
 * `setState`-in-effect).
 */
export const useEntityTaskStore = () => {
  const [tasksById, setTasksById] = useState<Record<string, IEntityTask>>({});

  const track = useCallback((id: string, task: IEntityTask) => {
    setTasksById((current) => ({ ...current, [id]: task }));
  }, []);

  const untrack = useCallback((id: string) => {
    setTasksById((current) => {
      if (!(id in current)) return current;
      const { [id]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  return { tasksById, track, untrack };
};
