import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import type {
  RepositoryAddRemoveContent,
  RepositoryResponse,
} from "@app/client";
import { useNotifications } from "@app/hooks/useNotifications";
import { useWatchedTask } from "@app/hooks/useWatchedTask";
import { repositoryKeys } from "@app/queries/repositories";
import {
  extractIdFromHref,
  parseRepositoryVersionHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { contentChangeTitle } from "@app/utils/contentChangeNotify";
import { latestVersionNumber } from "@app/utils/latestVersionNumber";
import { extractTaskDomain } from "@app/utils/taskHref";
import { notifyTaskFailed, notifyTaskStarted } from "@app/utils/taskNotify";

export interface IContentChangeWatchParams {
  taskHref: string;
  repository: RepositoryResponse;
  body?: RepositoryAddRemoveContent;
  /** Names the change in the started toast; else it's derived from `body`. */
  title?: string;
}

/**
 * Follows one content change task (modify, add, remove, import): toasts its start and
 * outcome, refreshes the repository, and keeps a failure for an inline alert.
 */
export const useContentChangeTask = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [task, setTask] = useState<{
    taskHref: string;
    repository: RepositoryResponse;
  } | null>(null);
  const [failure, setFailure] = useState<{
    taskHref: string;
    message?: string;
  } | null>(null);

  useWatchedTask({
    taskHref: task?.taskHref,
    onSettled: (outcome) => {
      if (!task) return;
      setTask(null);
      const { repository } = task;
      void queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(repository.pulp_href ?? ""),
      });
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
      const name = `"${repository.name}"`;

      if (outcome.failed) {
        notifyTaskFailed({
          addNotification,
          taskHref: outcome.taskHref,
          title: `Could not change the content of ${name}`,
          description: outcome.errorMessage,
        });
        setFailure({
          taskHref: outcome.taskHref,
          message: outcome.errorMessage,
        });
        return;
      }

      const version = outcome.createdResources
        .map((href) => parseRepositoryVersionHref(href))
        .find((parsed) => !!parsed);
      if (!version) {
        const latestNumber = latestVersionNumber(repository);
        addNotification({
          title: "No changes",
          variant: "info",
          description:
            latestNumber === undefined
              ? `${name} is unchanged.`
              : `${name} is still at version ${latestNumber}.`,
        });
        return;
      }
      addNotification({
        title: `Version ${version.number} of ${name} created`,
        variant: "success",
        description: (
          <Link
            to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber"
            params={{
              pulpDomain: extractTaskDomain(version.repositoryHref),
              repositoryType: resolvePulpType(version.repositoryHref) ?? "",
              repositoryId: extractIdFromHref(version.repositoryHref),
              versionNumber: version.number,
            }}
          >
            View version {version.number}
          </Link>
        ),
      });
    },
  });

  return {
    /** The change being watched, while it runs. */
    task,
    failure,
    watch: ({
      taskHref,
      repository,
      body,
      title,
    }: IContentChangeWatchParams) => {
      notifyTaskStarted({
        addNotification,
        taskHref,
        title:
          title ??
          contentChangeTitle({
            repositoryName: repository.name,
            body: body ?? {},
          }),
      });
      setFailure(null);
      setTask({ taskHref, repository });
    },
    clearFailure: () => setFailure(null),
  };
};
