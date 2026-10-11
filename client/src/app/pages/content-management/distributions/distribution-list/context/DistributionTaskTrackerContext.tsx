import { createContext } from "react";

/** Both delete and update are async (202 + task) for distributions; only delete is wired today. */
export type DistributionTaskKind = "delete" | "update";

export interface IDistributionTask {
  kind: DistributionTaskKind;
  taskHref: string;
}

export interface IDistributionTaskTracker {
  tasksByDistributionId: Record<string, IDistributionTask>;
  track: (distributionId: string, task: IDistributionTask) => void;
  untrack: (distributionId: string) => void;
}

export const DistributionTaskTrackerContext =
  createContext<IDistributionTaskTracker>({
    tasksByDistributionId: {},
    track: () => {},
    untrack: () => {},
  });
