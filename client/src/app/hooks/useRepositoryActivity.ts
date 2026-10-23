import { useQueryClient } from "@tanstack/react-query";

import type { RepositoryResponse } from "@app/client";
import { useContentChangeTask } from "@app/hooks/useContentChangeTask";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import { repositoryKeys } from "@app/queries/repositories";

/**
 * What runs on a repository: its active task (ours or anyone's, e.g. a sync) and the
 * content change this page dispatched. While anything runs, content changes are
 * paused; `lockedProps` disables a header menu item with the reason as a tooltip.
 */
export const useRepositoryActivity = ({
  repository,
}: {
  repository?: RepositoryResponse;
}) => {
  const queryClient = useQueryClient();
  const contentChange = useContentChangeTask();
  // A settled task (e.g. sync) may have bumped the latest version: refresh it.
  const { getActiveCount, getTasks } = useResourceTasks({
    entities: repository ? [repository] : [],
    onSettled: ({ entity }) => {
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(entity.pulp_href ?? ""),
      });
    },
  });

  const activeTask = getTasks(repository?.prn)[0];
  const changeTaskHref = contentChange.task?.taskHref;
  const isRunning = getActiveCount(repository?.prn) > 0 || !!changeTaskHref;

  return {
    contentChange,
    isRunning,
    running: isRunning
      ? {
          taskHref: activeTask?.taskHref ?? changeTaskHref,
          kind: activeTask?.kind ?? (changeTaskHref ? "modify" : undefined),
        }
      : undefined,
    lockedProps: isRunning
      ? {
          isAriaDisabled: true,
          tooltipProps: { content: "Wait for the running task to finish" },
        }
      : {},
  };
};
