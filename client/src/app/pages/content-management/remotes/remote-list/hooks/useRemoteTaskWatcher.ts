import { use, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { GenericRemoteResponse } from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { remoteKeys } from "@app/queries/remotes";
import {
  isTerminalTaskState,
  tasksByIdsQueryOptions,
} from "@app/queries/tasks";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { RemoteTaskTrackerContext } from "../context/RemoteTaskTrackerContext";

/**
 * Polls tracked delete tasks for the current page; on completion untracks the row
 * and refreshes the list. Polls the selected domain (remotes are domain-scoped).
 */
export const useRemoteTaskWatcher = (
  remotes: GenericRemoteResponse[],
): void => {
  const { tasksByRemoteId, untrack } = use(RemoteTaskTrackerContext);
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const selectedDomain = useSelectedDomain();

  const taskIds = remotes
    .map((remote) => {
      const remoteId = remote.pulp_href && extractIdFromHref(remote.pulp_href);
      return remoteId ? tasksByRemoteId[remoteId]?.taskHref : undefined;
    })
    .filter((taskHref): taskHref is string => !!taskHref)
    .map((taskHref) => extractIdFromHref(taskHref))
    .sort();

  const { data: tasks } = useQuery(
    tasksByIdsQueryOptions(selectedDomain, taskIds),
  );

  useEffect(() => {
    if (!tasks) return;
    for (const remote of remotes) {
      const remoteId = remote.pulp_href && extractIdFromHref(remote.pulp_href);
      const tracked = remoteId ? tasksByRemoteId[remoteId] : undefined;
      if (!remoteId || !tracked) continue;

      const task = tasks.find(
        (candidate) =>
          candidate.pulp_href &&
          extractIdFromHref(candidate.pulp_href) ===
            extractIdFromHref(tracked.taskHref),
      );
      if (!task || !isTerminalTaskState(task.state)) continue;

      untrack(remoteId);
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      if (task.state === "failed" || task.state === "canceled") {
        addNotification({
          title: `Failed to ${tracked.kind} remote "${remote.name}"`,
          variant: "danger",
        });
      }
    }
  }, [tasks, remotes, tasksByRemoteId, untrack, queryClient, addNotification]);
};
