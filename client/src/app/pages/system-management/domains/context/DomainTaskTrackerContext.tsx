import { createContext } from "react";

export type DomainTaskKind = "delete" | "update";

export interface IDomainTask {
  kind: DomainTaskKind;
  taskHref: string;
}

export interface IDomainTaskTracker {
  tasksByDomainId: Record<string, IDomainTask>;
  track: (domainId: string, task: IDomainTask) => void;
  untrack: (domainId: string) => void;
}

export const DomainTaskTrackerContext = createContext<IDomainTaskTracker>({
  tasksByDomainId: {},
  track: () => {},
  untrack: () => {},
});
