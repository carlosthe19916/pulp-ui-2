import { use, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { RepositoryResponse } from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { repositoryKeys } from "@app/queries/repositories";
import {
  isTerminalTaskState,
  tasksByIdsQueryOptions,
} from "@app/queries/tasks";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { RepositoryTaskTrackerContext } from "../context/RepositoryTaskTrackerContext";

/**
 * Polls tracked delete tasks for the current page; on completion untracks the row
 * and refreshes the list. Polls the selected domain (repositories are domain-scoped).
 */
export const useRepositoryTaskWatcher = (
  repositories: RepositoryResponse[],
): void => {
  const { tasksByRepositoryId, untrack } = use(RepositoryTaskTrackerContext);
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const selectedDomain = useSelectedDomain();

  const taskIds = repositories
    .map((repository) => {
      const repositoryId =
        repository.pulp_href && extractIdFromHref(repository.pulp_href);
      return repositoryId
        ? tasksByRepositoryId[repositoryId]?.taskHref
        : undefined;
    })
    .filter((taskHref): taskHref is string => !!taskHref)
    .map((taskHref) => extractIdFromHref(taskHref))
    .sort();

  const { data: tasks } = useQuery(
    tasksByIdsQueryOptions(selectedDomain, taskIds),
  );

  useEffect(() => {
    if (!tasks) return;
    for (const repository of repositories) {
      const repositoryId =
        repository.pulp_href && extractIdFromHref(repository.pulp_href);
      const tracked = repositoryId
        ? tasksByRepositoryId[repositoryId]
        : undefined;
      if (!repositoryId || !tracked) continue;

      const task = tasks.find(
        (candidate) =>
          candidate.pulp_href &&
          extractIdFromHref(candidate.pulp_href) ===
            extractIdFromHref(tracked.taskHref),
      );
      if (!task || !isTerminalTaskState(task.state)) continue;

      untrack(repositoryId);
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      if (task.state === "failed" || task.state === "canceled") {
        addNotification({
          title: `Failed to ${tracked.kind} repository "${repository.name}"`,
          variant: "danger",
        });
      }
    }
  }, [
    tasks,
    repositories,
    tasksByRepositoryId,
    untrack,
    queryClient,
    addNotification,
  ]);
};
