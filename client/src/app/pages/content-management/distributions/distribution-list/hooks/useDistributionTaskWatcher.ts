import { use, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { DistributionResponse } from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { distributionKeys } from "@app/queries/distributions";
import {
  isTerminalTaskState,
  tasksByIdsQueryOptions,
} from "@app/queries/tasks";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { DistributionTaskTrackerContext } from "../context/DistributionTaskTrackerContext";

/**
 * Polls tracked delete tasks for the current page; on completion untracks the row
 * and refreshes the list. Polls the selected domain (distributions are domain-scoped).
 */
export const useDistributionTaskWatcher = (
  distributions: DistributionResponse[],
): void => {
  const { tasksByDistributionId, untrack } = use(
    DistributionTaskTrackerContext,
  );
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const selectedDomain = useSelectedDomain();

  const taskIds = distributions
    .map((distribution) => {
      const distributionId =
        distribution.pulp_href && extractIdFromHref(distribution.pulp_href);
      return distributionId
        ? tasksByDistributionId[distributionId]?.taskHref
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
    for (const distribution of distributions) {
      const distributionId =
        distribution.pulp_href && extractIdFromHref(distribution.pulp_href);
      const tracked = distributionId
        ? tasksByDistributionId[distributionId]
        : undefined;
      if (!distributionId || !tracked) continue;

      const task = tasks.find(
        (candidate) =>
          candidate.pulp_href &&
          extractIdFromHref(candidate.pulp_href) ===
            extractIdFromHref(tracked.taskHref),
      );
      if (!task || !isTerminalTaskState(task.state)) continue;

      untrack(distributionId);
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
      if (task.state === "failed" || task.state === "canceled") {
        addNotification({
          title: `Failed to ${tracked.kind} distribution "${distribution.name}"`,
          variant: "danger",
        });
      }
    }
  }, [
    tasks,
    distributions,
    tasksByDistributionId,
    untrack,
    queryClient,
    addNotification,
  ]);
};
