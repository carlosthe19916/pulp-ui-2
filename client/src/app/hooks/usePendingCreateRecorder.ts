import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  type PendingCreateEntityType,
  useTrackedTasksStore,
} from "@app/stores/useTrackedTasksStore";

/**
 * Tracks an async create (202 + task) so its list shows progress and `TaskTracker`
 * refreshes it when done; callers pass only the per-create `taskHref`/`name`.
 */
export const usePendingCreateRecorder = ({
  entityType,
}: {
  entityType: PendingCreateEntityType;
}): {
  recordPendingCreate: (args: { taskHref: string; name: string }) => void;
} => {
  const track = useTrackedTasksStore((state) => state.track);
  const domain = useSelectedDomain();

  const recordPendingCreate = ({
    taskHref,
    name,
  }: {
    taskHref: string;
    name: string;
  }) =>
    track({
      kind: "create",
      taskHref,
      entityType,
      domainName: domain.name,
      name,
    });

  return { recordPendingCreate };
};
