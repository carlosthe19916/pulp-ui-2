import { useEffect, useRef } from "react";

import {
  isTerminalTaskState,
  type ITaskStateProbe,
  useTaskDetailQueries,
} from "@app/queries/tasks";

const FAILED_STATES = new Set(["failed", "canceled"]);

/**
 * Polls one dispatched task until it is terminal (or 404s), then calls `onSettled`
 * once with its outcome. The caller owns what to show (toast, inline alert) and
 * clears `taskHref` afterwards. Polling stops when the caller unmounts.
 */
export const useWatchedTask = ({
  taskHref,
  onSettled,
}: {
  taskHref?: string | null;
  /** `failed` is true for failed/canceled; false for completed (or purged unseen). */
  onSettled: (
    outcome: ITaskStateProbe & { taskHref: string; failed: boolean },
  ) => void;
}): void => {
  const probes = useTaskDetailQueries({
    taskHrefs: taskHref ? [taskHref] : [],
  });
  const probe = taskHref ? probes.get(taskHref) : undefined;
  const notFound = probe?.notFound ?? false;
  const settled = notFound || isTerminalTaskState(probe?.state);

  // Keep the latest callback/probe current without making them effect dependencies.
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const probeRef = useRef(probe);
  probeRef.current = probe;

  const reportedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!taskHref || !settled || reportedRef.current === taskHref) return;
    reportedRef.current = taskHref;
    const latest = probeRef.current;
    onSettledRef.current({
      taskHref,
      state: latest?.state,
      notFound,
      errorMessage: latest?.errorMessage,
      createdResources: latest?.createdResources ?? [],
      failed: !notFound && FAILED_STATES.has(latest?.state ?? ""),
    });
  }, [taskHref, settled, notFound]);
};
