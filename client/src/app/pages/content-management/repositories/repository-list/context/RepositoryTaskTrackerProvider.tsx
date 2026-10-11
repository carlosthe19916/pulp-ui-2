import type React from "react";
import { useCallback, useMemo, useState } from "react";

import {
  RepositoryTaskTrackerContext,
  type IRepositoryTask,
  type IRepositoryTaskTracker,
} from "./RepositoryTaskTrackerContext";

export const RepositoryTaskTrackerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [tasksByRepositoryId, setTasksByRepositoryId] = useState<
    Record<string, IRepositoryTask>
  >({});

  const track = useCallback((repositoryId: string, task: IRepositoryTask) => {
    setTasksByRepositoryId((current) => ({
      ...current,
      [repositoryId]: task,
    }));
  }, []);

  const untrack = useCallback((repositoryId: string) => {
    setTasksByRepositoryId((current) => {
      if (!(repositoryId in current)) return current;
      const { [repositoryId]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const value = useMemo<IRepositoryTaskTracker>(
    () => ({ tasksByRepositoryId, track, untrack }),
    [tasksByRepositoryId, track, untrack],
  );

  return (
    <RepositoryTaskTrackerContext value={value}>
      {children}
    </RepositoryTaskTrackerContext>
  );
};
