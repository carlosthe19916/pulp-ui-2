import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useNotifications } from "@app/hooks/useNotifications";
import {
  type PendingCreateEntityType,
  usePendingCreatesStore,
} from "@app/hooks/usePendingCreatesStore";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { distributionKeys } from "@app/queries/distributions";
import { publicationKeys } from "@app/queries/publications";
import { isTerminalTaskState, useTaskDetailQueries } from "@app/queries/tasks";
import { notifyTaskFailed } from "@app/utils/taskNotify";

import { getEntityLabel } from "./entityLabel";

/** List query-key folders to invalidate when a create of each type settles. */
const listKeyByEntityType: Record<
  PendingCreateEntityType,
  () => readonly unknown[]
> = {
  distribution: () => distributionKeys.list(),
  publication: () => publicationKeys.list(),
};

const FAILED_STATES = new Set(["failed", "canceled"]);

/**
 * Polls this list's persisted pending creates (current domain); as each settles, evicts
 * it, refetches the list and toasts a failure.
 */
export const usePendingCreates = ({
  entityType,
}: {
  entityType: PendingCreateEntityType;
}): { pendingCount: number } => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { entries, remove } = usePendingCreatesStore();

  // Scope to this list + domain so creates don't leak across domains/types.
  const relevant = entries.filter(
    (entry) =>
      entry.entityType === entityType && entry.domainName === domain.name,
  );

  const probes = useTaskDetailQueries({
    taskHrefs: relevant.map((entry) => entry.taskHref),
  });

  const reconciled = relevant.map((entry) => {
    const probe = probes.get(entry.taskHref);
    const notFound = probe?.notFound ?? false;
    return {
      entry,
      settled: notFound || isTerminalTaskState(probe?.state),
      failed: !notFound && FAILED_STATES.has(probe?.state ?? ""),
      errorMessage: probe?.errorMessage,
    };
  });

  const settled = reconciled.filter((item) => item.settled);
  // The effect only reruns when the set of settled tasks changes.
  const settledSignature = settled.map((item) => item.entry.taskHref).join("|");
  const settledRef = useRef(settled);
  settledRef.current = settled;

  // Reconcile each settled task exactly once: evict, refresh the list, and toast
  // on failure.
  const processedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    settledRef.current.forEach(({ entry, failed, errorMessage }) => {
      if (processedRef.current.has(entry.taskHref)) return;
      processedRef.current.add(entry.taskHref);

      remove(entry.taskHref);
      // Refetch the whole list: the new row may land on any page.
      void queryClient.invalidateQueries({
        queryKey: listKeyByEntityType[entityType](),
      });

      if (failed) {
        const label = getEntityLabel(entityType);
        // Open tabs may each toast once; a rare duplicate isn't worth coordinating.
        notifyTaskFailed({
          addNotification,
          taskHref: entry.taskHref,
          title: entry.name
            ? `${label} "${entry.name}" creation failed`
            : `${label} creation failed`,
          description: errorMessage,
        });
      }
    });
  }, [settledSignature, entityType, queryClient, remove, addNotification]);

  const pendingCount = reconciled.filter((item) => !item.settled).length;

  return { pendingCount };
};
