import type React from "react";
import { useCallback, useMemo, useState } from "react";

import {
  DomainTaskTrackerContext,
  type IDomainTask,
  type IDomainTaskTracker,
} from "./DomainTaskTrackerContext";

export const DomainTaskTrackerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [tasksByDomainId, setTasksByDomainId] = useState<
    Record<string, IDomainTask>
  >({});

  const track = useCallback((domainId: string, task: IDomainTask) => {
    setTasksByDomainId((current) => ({
      ...current,
      [domainId]: task,
    }));
  }, []);

  const untrack = useCallback((domainId: string) => {
    setTasksByDomainId((current) => {
      if (!(domainId in current)) return current;
      const { [domainId]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const value = useMemo<IDomainTaskTracker>(
    () => ({ tasksByDomainId, track, untrack }),
    [tasksByDomainId, track, untrack],
  );

  return (
    <DomainTaskTrackerContext value={value}>
      {children}
    </DomainTaskTrackerContext>
  );
};
