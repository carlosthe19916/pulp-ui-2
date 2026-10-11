import { createContext } from "react";

/** Both delete and update are async (202 + task) for remotes; only delete is wired today. */
export type RemoteTaskKind = "delete" | "update";

export interface IRemoteTask {
  kind: RemoteTaskKind;
  taskHref: string;
}

export interface IRemoteTaskTracker {
  tasksByRemoteId: Record<string, IRemoteTask>;
  track: (remoteId: string, task: IRemoteTask) => void;
  untrack: (remoteId: string) => void;
}

export const RemoteTaskTrackerContext = createContext<IRemoteTaskTracker>({
  tasksByRemoteId: {},
  track: () => {},
  untrack: () => {},
});
