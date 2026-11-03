import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { type ISettledTask, isSettledTask } from "@app/queries/tasks";

import { extractTaskDomain, extractTaskId } from "./taskHref";

interface INotifyFn {
  (notification: {
    title: string;
    variant: "success" | "danger" | "warning" | "info" | "custom";
    description?: ReactNode;
  }): void;
}

export interface INotifyTaskStartedOptions {
  addNotification: INotifyFn;
  taskHref: string;
  title?: string;
}

/** Toast helper for task-producing operations (202 responses). */
export const notifyTaskStarted = ({
  addNotification,
  taskHref,
  title = "Task started",
}: INotifyTaskStartedOptions) => {
  const taskId = extractTaskId(taskHref);
  const pulpDomain = extractTaskDomain(taskHref);
  addNotification({
    title,
    variant: "info",
    description: (
      <>
        Track progress on the{" "}
        <Link
          to="/monitoring/$pulpDomain/tasks/$taskId"
          params={{ pulpDomain, taskId }}
        >
          task detail
        </Link>{" "}
        page.
      </>
    ),
  });
};

export interface INotifyUpdateResultOptions {
  addNotification: INotifyFn;
  /** Reports a started task (`useTaskStarted`). */
  taskStarted: (task: { taskHref: string; title: string }) => void;
  /** The updated object (200), or the task it ran as (202), waited for briefly. */
  data: object;
  /** What was updated, e.g. `Remote "foo"`. */
  subject: string;
}

/** Toast for an update that Pulp may run as a task or apply at once. */
export const notifyUpdateResult = ({
  addNotification,
  taskStarted,
  data,
  subject,
}: INotifyUpdateResultOptions) => {
  if (isSettledTask(data) && !data.finished) {
    taskStarted({
      taskHref: data.taskHref,
      title: `${subject} update started`,
    });
  } else {
    addNotification({ title: `${subject} updated`, variant: "success" });
  }
};

export interface INotifyTaskGroupStartedOptions {
  addNotification: INotifyFn;
  taskGroupHref: string;
  title?: string;
}

/** Toast helper for operations that start a task group (replicate, ACS refresh). */
export const notifyTaskGroupStarted = ({
  addNotification,
  taskGroupHref,
  title = "Tasks started",
}: INotifyTaskGroupStartedOptions) => {
  const taskGroupId = extractTaskId(taskGroupHref);
  const pulpDomain = extractTaskDomain(taskGroupHref);
  addNotification({
    title,
    variant: "info",
    description: (
      <>
        Track progress on the{" "}
        <Link
          to="/monitoring/$pulpDomain/task-groups/$taskGroupId"
          params={{ pulpDomain, taskGroupId }}
        >
          task group
        </Link>{" "}
        page.
      </>
    ),
  });
};

export interface INotifyTaskSettledOptions {
  addNotification: INotifyFn;
  /** Reports a started task (`useTaskStarted`). */
  taskStarted: (task: { taskHref: string; title: string }) => void;
  settled: ISettledTask;
  /** When the task finished within the wait, e.g. `Remote "foo" deleted`. */
  doneTitle: string;
  /** When it is still running and moves to the task drawer. */
  startedTitle: string;
}

/** A configuration write that ran as a task: its outcome, or its start if still running. */
export const notifyTaskSettled = ({
  addNotification,
  taskStarted,
  settled,
  doneTitle,
  startedTitle,
}: INotifyTaskSettledOptions) => {
  if (settled.finished) {
    addNotification({ title: doneTitle, variant: "success" });
  } else {
    taskStarted({ taskHref: settled.taskHref, title: startedTitle });
  }
};
