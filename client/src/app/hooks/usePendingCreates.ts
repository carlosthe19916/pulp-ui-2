import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { getEntityLabel } from "@catalog";
import { useNotifications } from "@app/context/useNotifications";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { distributionKeys } from "@app/queries/distributions";
import { publicationKeys } from "@app/queries/publications";
import { isTerminalTaskState, useTaskDetailQueries } from "@app/queries/tasks";
import { notifyTaskFailed } from "@app/utils/taskNotify";

import {
  usePendingCreatesStore,
  type PendingCreateEntityType,
} from "./usePendingCreatesStore";

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
 * Drives the "a create is in flight" state for one list. Reads the persisted
 * pending creates for this `entityType` + current domain, polls each create
 * task until terminal, then evicts the entry and refetches the list so the new
 * row appears (it may land on any page). Failures/cancellations raise a toast;
 * success is silent. Refresh-proof: the task href comes from localStorage, so a
 * reload resumes polling.
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
    settledRef.current.forEach(({ entry, failed }) => {
      if (processedRef.current.has(entry.taskHref)) return;
      processedRef.current.add(entry.taskHref);

      remove(entry.taskHref);
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
        });
      }
    });
  }, [settledSignature, entityType, queryClient, remove, addNotification]);

  const pendingCount = reconciled.filter((item) => !item.settled).length;

  return { pendingCount };
};
