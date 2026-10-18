import { useCallback } from "react";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  usePendingCreatesStore,
  type PendingCreateEntityType,
} from "@app/hooks/usePendingCreatesStore";

/**
 * Records an async create (202 + task) as pending so the list surfaces its
 * progress. Captures `entityType` + domain once; callers pass only the per-create
 * `taskHref`/`name`.
 */
export const usePendingCreateRecorder = ({
  entityType,
}: {
  entityType: PendingCreateEntityType;
}): {
  recordPendingCreate: (args: { taskHref: string; name: string }) => void;
} => {
  const { add } = usePendingCreatesStore();
  const domain = useSelectedDomain();

  const recordPendingCreate = useCallback(
    ({ taskHref, name }: { taskHref: string; name: string }) =>
      add({ taskHref, entityType, domainName: domain.name, name }),
    [add, entityType, domain.name],
  );

  return { recordPendingCreate };
};
