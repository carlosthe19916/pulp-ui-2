import { createContext } from "react";

import type { EntityTaskKind } from "@app/components/EntityTaskStatus";

export interface IDomainTask {
  kind: EntityTaskKind;
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
