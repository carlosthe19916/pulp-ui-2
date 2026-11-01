import { useState } from "react";

import type {
  RepositoryAddRemoveContent,
  RepositoryResponse,
} from "@app/client";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  type ITrackedContentChange,
  type ITrackedTask,
  useTrackedTasksStore,
} from "@app/stores/useTrackedTasksStore";
import { contentChangeTitle } from "@app/utils/contentChangeNotify";
import { latestVersionNumber } from "@app/utils/latestVersionNumber";
import { notifyTaskStarted } from "@app/utils/taskNotify";

export interface IContentChangeWatchParams {
  taskHref: string;
  repository: RepositoryResponse;
  body?: RepositoryAddRemoveContent;
  /** Names the change in the started toast; else it's derived from `body`. */
  title?: string;
}

const isContentChange = (task: ITrackedTask): task is ITrackedContentChange =>
  task.kind === "content-change";

/**
 * Starts following a content change task (modify, add, remove, import): toasts its start
 * and hands it to `TaskTracker`, which reports the outcome even after this page is gone.
 * With `repositoryHref`, `task` and `failure` are that repository's; without it, `task`
 * is the change this caller started.
 */
export const useContentChangeTask = ({
  repositoryHref,
}: { repositoryHref?: string } = {}) => {
  const { addNotification } = useNotifications();
  const track = useTrackedTasksStore((state) => state.track);
  const clearFailure = useTrackedTasksStore((state) => state.clearFailure);
  const [startedHref, setStartedHref] = useState<string>();

  const task = useTrackedTasksStore((state) =>
    state.tasks
      .filter(isContentChange)
      .find((tracked) =>
        repositoryHref
          ? tracked.repositoryHref === repositoryHref
          : tracked.taskHref === startedHref,
      ),
  );
  const failure = useTrackedTasksStore((state) =>
    repositoryHref ? state.failures[repositoryHref] : undefined,
  );

  return {
    /** The change being watched, while it runs. */
    task: task ?? null,
    failure: failure ?? null,
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
      setStartedHref(taskHref);
      track({
        kind: "content-change",
        taskHref,
        repositoryHref: repository.pulp_href ?? "",
        repositoryName: repository.name,
        latestVersion: latestVersionNumber(repository),
      });
    },
    clearFailure: () => {
      if (repositoryHref) clearFailure(repositoryHref);
    },
  };
};
