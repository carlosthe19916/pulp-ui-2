import { createContext } from "react";

import { removeFromLocalStorage } from "@app/hooks/useStorage";

/** A task this browser started, as recorded when it started. */
export interface ITrackedTask {
  taskHref: string;
  /** The started toast's title, e.g. `Sync of "my-repo" started`. */
  title: string;
  startedAt: number;
}

/** A tracked task with its live state from Pulp. */
export interface ITrackedTaskStatus extends ITrackedTask {
  state?: string;
  /** The task was purged before it could be read. */
  notFound: boolean;
  errorMessage?: string;
  /** Hrefs the task created (e.g. a new repository version). */
  createdResources: readonly string[];
  /** Still running or waiting (or not read yet). */
  isActive: boolean;
}

export interface ITaskTrackerContextValue {
  /** Newest first. */
  tasks: ITrackedTaskStatus[];
  trackTask: (task: Omit<ITrackedTask, "startedAt">) => void;
  clearFinished: () => void;
}

export const TRACKED_TASKS_KEY = "pulp-ui/tracked-tasks";

/** Forgets every tracked task; called on logout. */
export const clearTrackedTasks = (): void =>
  removeFromLocalStorage(TRACKED_TASKS_KEY);

export const TaskTrackerContext =
  createContext<ITaskTrackerContextValue | null>(null);
