import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { useNotifications } from "@app/hooks/useNotifications";
import { distributionKeys } from "@app/queries/distributions";
import { publicationKeys } from "@app/queries/publications";
import { repositoryKeys } from "@app/queries/repositories";
import type { ITaskStateProbe } from "@app/queries/tasks";
import {
  extractIdFromHref,
  parseRepositoryVersionHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import {
  type ITrackedContentChange,
  type ITrackedCreate,
  type ITrackedTask,
  type PendingCreateEntityType,
  useTrackedTasksStore,
} from "@app/stores/useTrackedTasksStore";
import { getEntityLabel } from "@app/utils/entityLabel";
import { extractTaskDomain } from "@app/utils/taskHref";
import { notifyTaskFailed } from "@app/utils/taskNotify";

/** A tracked task's final state; `failed` is true for failed or canceled. */
export type ITaskOutcome = ITaskStateProbe & { failed: boolean };

const listKeyByEntityType: Record<
  PendingCreateEntityType,
  () => readonly unknown[]
> = {
  distribution: () => distributionKeys.list(),
  publication: () => publicationKeys.list(),
};

/** What happens when each kind of tracked task finishes: refresh views, toast the outcome. */
export const useTaskSettledHandler = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const setFailure = useTrackedTasksStore((state) => state.setFailure);

  const onContentChangeSettled = ({
    task,
    outcome,
  }: {
    task: ITrackedContentChange;
    outcome: ITaskOutcome;
  }) => {
    void queryClient.invalidateQueries({
      queryKey: repositoryKeys.detail(task.repositoryHref),
    });
    void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
    const name = `"${task.repositoryName}"`;

    if (outcome.failed) {
      notifyTaskFailed({
        addNotification,
        taskHref: task.taskHref,
        title: `Could not change the content of ${name}`,
        description: outcome.errorMessage,
      });
      setFailure({
        repositoryHref: task.repositoryHref,
        failure: { taskHref: task.taskHref, message: outcome.errorMessage },
      });
      return;
    }

    const version = outcome.createdResources
      .map((href) => parseRepositoryVersionHref(href))
      .find((parsed) => !!parsed);
    if (!version) {
      addNotification({
        title: "No changes",
        variant: "info",
        description:
          task.latestVersion === undefined
            ? `${name} is unchanged.`
            : `${name} is still at version ${task.latestVersion}.`,
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
  };

  const onCreateSettled = ({
    task,
    outcome,
  }: {
    task: ITrackedCreate;
    outcome: ITaskOutcome;
  }) => {
    // Refetch the whole list: the new row may land on any page.
    void queryClient.invalidateQueries({
      queryKey: listKeyByEntityType[task.entityType](),
    });
    if (!outcome.failed) return;
    const label = getEntityLabel(task.entityType);
    notifyTaskFailed({
      addNotification,
      taskHref: task.taskHref,
      title: task.name
        ? `${label} "${task.name}" creation failed`
        : `${label} creation failed`,
      description: outcome.errorMessage,
    });
  };

  return ({ task, outcome }: { task: ITrackedTask; outcome: ITaskOutcome }) => {
    switch (task.kind) {
      case "content-change":
        onContentChangeSettled({ task, outcome });
        return;
      case "create":
        onCreateSettled({ task, outcome });
        return;
    }
  };
};
