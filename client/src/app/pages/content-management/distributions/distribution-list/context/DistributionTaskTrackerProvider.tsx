import type React from "react";
import { useCallback, useMemo, useState } from "react";

import {
  DistributionTaskTrackerContext,
  type IDistributionTask,
  type IDistributionTaskTracker,
} from "./DistributionTaskTrackerContext";

export const DistributionTaskTrackerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [tasksByDistributionId, setTasksByDistributionId] = useState<
    Record<string, IDistributionTask>
  >({});

  const track = useCallback(
    (distributionId: string, task: IDistributionTask) => {
      setTasksByDistributionId((current) => ({
        ...current,
        [distributionId]: task,
      }));
    },
    [],
  );

  const untrack = useCallback((distributionId: string) => {
    setTasksByDistributionId((current) => {
      if (!(distributionId in current)) return current;
      const { [distributionId]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const value = useMemo<IDistributionTaskTracker>(
    () => ({ tasksByDistributionId, track, untrack }),
    [tasksByDistributionId, track, untrack],
  );

  return (
    <DistributionTaskTrackerContext value={value}>
      {children}
    </DistributionTaskTrackerContext>
  );
};
