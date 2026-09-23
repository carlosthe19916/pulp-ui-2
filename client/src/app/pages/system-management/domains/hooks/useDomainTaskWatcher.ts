import { use, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { DomainResponse } from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { domainKeys } from "@app/queries/domains";
import {
  isTerminalTaskState,
  tasksByIdsQueryOptions,
} from "@app/queries/tasks";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { DomainTaskTrackerContext } from "../context/DomainTaskTrackerContext";

/** Polls the current-page domains' in-flight tasks; on completion, untracks and refreshes the list. */
export const useDomainTaskWatcher = (domains: DomainResponse[]): void => {
  const { tasksByDomainId, untrack } = use(DomainTaskTrackerContext);
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const apiDomain = useApiDomain();

  const taskIds = domains
    .map((domain) => {
      const domainId = domain.pulp_href && extractIdFromHref(domain.pulp_href);
      return domainId ? tasksByDomainId[domainId]?.taskHref : undefined;
    })
    .filter((taskHref): taskHref is string => !!taskHref)
    .map((taskHref) => extractIdFromHref(taskHref))
    .sort();

  const { data: tasks } = useQuery(tasksByIdsQueryOptions(apiDomain, taskIds));

  useEffect(() => {
    if (!tasks) return;
    for (const domain of domains) {
      const domainId = domain.pulp_href && extractIdFromHref(domain.pulp_href);
      const tracked = domainId ? tasksByDomainId[domainId] : undefined;
      if (!domainId || !tracked) continue;

      const task = tasks.find(
        (candidate) =>
          candidate.pulp_href &&
          extractIdFromHref(candidate.pulp_href) ===
            extractIdFromHref(tracked.taskHref),
      );
      if (!task || !isTerminalTaskState(task.state)) continue;

      untrack(domainId);
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
      if (task.state === "failed" || task.state === "canceled") {
        addNotification({
          title: `Failed to ${tracked.kind} domain "${domain.name}"`,
          variant: "danger",
        });
      }
    }
  }, [tasks, domains, tasksByDomainId, untrack, queryClient, addNotification]);
};
