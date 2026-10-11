import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { AsyncOperationResponse } from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import { useEntityTaskStore } from "@app/hooks/useEntityTaskStore";
import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  isTerminalTaskState,
  tasksByIdsQueryOptions,
} from "@app/queries/tasks";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

interface ITrackedEntity {
  pulp_href?: string | null;
  name?: string | null;
}

interface IEntityDeleteMutation {
  mutateAsync: (href: string) => Promise<AsyncOperationResponse>;
  isPending: boolean;
}

/**
 * Per-list async-task tracker for domain-scoped content families (remotes,
 * repositories, distributions). Keeps the in-flight task map, polls those tasks in
 * the given (selected) domain, and untracks + refreshes the list when they reach a
 * terminal state. Also wraps the family's dedicated delete mutation so the deleted
 * row shows a "Deleting…" spinner until the task finishes.
 *
 * Context-free: for these families the list is the sole writer/reader/watcher, so
 * local state suffices (unlike Domains, whose update writer is a separate modal).
 * `track` is returned for a future update-tracking flow.
 */
export const useEntityTaskTracker = <T extends ITrackedEntity>({
  entities,
  domain,
  listQueryKey,
  label,
  deleteMutation,
}: {
  entities: T[];
  domain: IPulpDomain;
  listQueryKey: readonly unknown[];
  /** Display label, e.g. "Remote" — lower-cased for error toasts. */
  label: string;
  deleteMutation: IEntityDeleteMutation;
}) => {
  const { runAction } = useMutationAction();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const { tasksById, track, untrack } = useEntityTaskStore();

  const taskIds = entities
    .map((entity) => {
      const id = entity.pulp_href && extractIdFromHref(entity.pulp_href);
      return id ? tasksById[id]?.taskHref : undefined;
    })
    .filter((taskHref): taskHref is string => !!taskHref)
    .map((taskHref) => extractIdFromHref(taskHref))
    .sort();

  const { data: tasks } = useQuery(tasksByIdsQueryOptions(domain, taskIds));

  useEffect(() => {
    if (!tasks) return;
    for (const entity of entities) {
      const id = entity.pulp_href && extractIdFromHref(entity.pulp_href);
      const tracked = id ? tasksById[id] : undefined;
      if (!id || !tracked) continue;

      const task = tasks.find(
        (candidate) =>
          candidate.pulp_href &&
          extractIdFromHref(candidate.pulp_href) ===
            extractIdFromHref(tracked.taskHref),
      );
      if (!task || !isTerminalTaskState(task.state)) continue;

      untrack(id);
      void queryClient.invalidateQueries({ queryKey: listQueryKey });
      if (task.state === "failed" || task.state === "canceled") {
        addNotification({
          title: `Failed to ${tracked.kind} ${label.toLowerCase()} "${entity.name}"`,
          variant: "danger",
        });
      }
    }
  }, [
    tasks,
    entities,
    tasksById,
    untrack,
    queryClient,
    addNotification,
    listQueryKey,
    label,
  ]);

  const deleteEntity = async (entity: T) => {
    const id = extractIdFromHref(entity.pulp_href ?? "");
    const result = await runAction(
      () => deleteMutation.mutateAsync(entity.pulp_href ?? ""),
      {
        successTitle: `${label} "${entity.name}" deleted`,
        errorTitle: `Failed to delete ${label.toLowerCase()}`,
        taskAware: true,
        taskTitle: `${label} "${entity.name}" deletion started`,
      },
    );
    if (result.task) {
      track(id, { kind: "delete", taskHref: result.task });
    }
    return result;
  };

  return {
    tasksById,
    track,
    deleteEntity,
    isDeleting: deleteMutation.isPending,
  };
};
