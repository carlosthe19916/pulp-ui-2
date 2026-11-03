import { isTerminalTaskState, useTaskDetailQueries } from "@app/queries/tasks";
import {
  type ITrackedTask,
  useTrackedTasksStore,
} from "@app/stores/useTrackedTasksStore";

/** A tracked task with its live state from Pulp. */
export interface ITrackedTaskStatus extends ITrackedTask {
  state?: string;
  /** The task was purged before it could be read. */
  notFound: boolean;
  /** Its state couldn't be read (403, 5xx, network) and isn't known yet. */
  isUnreadable: boolean;
  errorMessage?: string;
  /** Hrefs the task created (e.g. a new repository version). */
  createdResources: readonly string[];
  /** Still running or waiting (or not read yet). */
  isActive: boolean;
}

/** The tracked tasks, newest first, each with its state polled from Pulp. */
export const useTrackedTasks = (): ITrackedTaskStatus[] => {
  const tasks = useTrackedTasksStore((state) => state.tasks);
  const probes = useTaskDetailQueries({
    taskHrefs: tasks.map((task) => task.taskHref),
  });
  return tasks.map((task) => {
    const probe = probes.get(task.taskHref);
    const notFound = probe?.notFound ?? false;
    const isUnreadable = !!probe?.isError && !probe.state;
    return {
      ...task,
      state: probe?.state,
      notFound,
      isUnreadable,
      errorMessage: probe?.errorMessage,
      createdResources: probe?.createdResources ?? [],
      isActive:
        !notFound && !isUnreadable && !isTerminalTaskState(probe?.state),
    };
  });
};
