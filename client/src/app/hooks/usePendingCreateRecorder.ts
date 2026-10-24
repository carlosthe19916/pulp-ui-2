import {
  type PendingCreateEntityType,
  usePendingCreatesStore,
} from "@app/hooks/usePendingCreatesStore";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

/**
 * Records an async create (202 + task) as pending so its list shows progress; callers
 * pass only the per-create `taskHref`/`name`.
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

  const recordPendingCreate = ({
    taskHref,
    name,
  }: {
    taskHref: string;
    name: string;
  }) => add({ taskHref, entityType, domainName: domain.name, name });

  return { recordPendingCreate };
};
