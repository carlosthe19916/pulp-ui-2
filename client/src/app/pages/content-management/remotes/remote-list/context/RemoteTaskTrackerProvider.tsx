import type React from "react";
import { useCallback, useMemo, useState } from "react";

import {
  RemoteTaskTrackerContext,
  type IRemoteTask,
  type IRemoteTaskTracker,
} from "./RemoteTaskTrackerContext";

export const RemoteTaskTrackerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [tasksByRemoteId, setTasksByRemoteId] = useState<
    Record<string, IRemoteTask>
  >({});

  const track = useCallback((remoteId: string, task: IRemoteTask) => {
    setTasksByRemoteId((current) => ({
      ...current,
      [remoteId]: task,
    }));
  }, []);

  const untrack = useCallback((remoteId: string) => {
    setTasksByRemoteId((current) => {
      if (!(remoteId in current)) return current;
      const { [remoteId]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const value = useMemo<IRemoteTaskTracker>(
    () => ({ tasksByRemoteId, track, untrack }),
    [tasksByRemoteId, track, untrack],
  );

  return (
    <RemoteTaskTrackerContext value={value}>
      {children}
    </RemoteTaskTrackerContext>
  );
};
