import { use, useEffect } from "react";

import type { TaskResponse } from "@app/client";
import type { IEntityTask } from "@app/context/EntityTaskTracker/EntityTaskTrackerContext";
import { EntityTaskTrackerContext } from "@app/context/EntityTaskTracker/EntityTaskTrackerContext";
import { isTerminalTaskState, useTasksByIdsQuery } from "@app/queries/tasks";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

interface ITrackedEntity {
  pulp_href?: string | null;
  name?: string | null;
}

/**
 * Polls the current page's tracked tasks and, on completion, untracks the row
 * and invokes `onFinishedState` so the caller can decide what to do next
 * (e.g. refresh the list, toast on failure).
 */
export const useEntityTaskWatcher = <T extends ITrackedEntity>({
  entities,
  onFinishedState,
}: {
  entities: T[];
  /** Invoked once per row whose tracked task reached a terminal state. */
  onFinishedState: (args: {
    task: TaskResponse;
    tracked: IEntityTask;
    entity: T;
  }) => void;
}): void => {
  const { tasksById, untrack } = use(EntityTaskTrackerContext);

  const taskIds = entities
    .map((entity) => {
      const id = entity.pulp_href && extractIdFromHref(entity.pulp_href);
      return id ? tasksById[id]?.taskHref : undefined;
    })
    .filter((taskHref): taskHref is string => !!taskHref)
    .map((taskHref) => extractIdFromHref(taskHref))
    .sort();

  const { data: tasks } = useTasksByIdsQuery(taskIds);

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
      onFinishedState({ task, tracked, entity });
    }
  }, [tasks, entities, tasksById, untrack, onFinishedState]);
};
