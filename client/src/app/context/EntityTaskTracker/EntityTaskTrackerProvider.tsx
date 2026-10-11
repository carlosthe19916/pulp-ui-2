import type React from "react";
import { useCallback, useMemo, useState } from "react";

import {
  EntityTaskTrackerContext,
  type IEntityTask,
  type IEntityTaskTracker,
} from "./EntityTaskTrackerContext";

export const EntityTaskTrackerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
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

  const value = useMemo<IEntityTaskTracker>(
    () => ({ tasksById, track, untrack }),
    [tasksById, track, untrack],
  );

  return (
    <EntityTaskTrackerContext value={value}>
      {children}
    </EntityTaskTrackerContext>
  );
};
