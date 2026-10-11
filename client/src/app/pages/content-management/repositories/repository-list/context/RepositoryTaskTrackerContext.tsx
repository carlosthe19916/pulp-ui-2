import { createContext } from "react";

/** Both delete and update are async (202 + task) for repositories; only delete is wired today. */
export type RepositoryTaskKind = "delete" | "update";

export interface IRepositoryTask {
  kind: RepositoryTaskKind;
  taskHref: string;
}

export interface IRepositoryTaskTracker {
  tasksByRepositoryId: Record<string, IRepositoryTask>;
  track: (repositoryId: string, task: IRepositoryTask) => void;
  untrack: (repositoryId: string) => void;
}

export const RepositoryTaskTrackerContext =
  createContext<IRepositoryTaskTracker>({
    tasksByRepositoryId: {},
    track: () => {},
    untrack: () => {},
  });
