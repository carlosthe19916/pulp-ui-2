import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

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

export interface INotifyTaskFailedOptions {
  addNotification: INotifyFn;
  taskHref: string;
  title?: string;
  /** The task's failure detail (e.g. `getTaskErrorMessage(task)`), shown inline. */
  description?: string;
}

/** Toast helper for a task that ended in failure/cancellation. */
export const notifyTaskFailed = ({
  addNotification,
  taskHref,
  title = "Task failed",
  description,
}: INotifyTaskFailedOptions) => {
  const taskId = extractTaskId(taskHref);
  const pulpDomain = extractTaskDomain(taskHref);
  addNotification({
    title,
    variant: "danger",
    description: (
      <>
        {description ? <>{description} </> : "See the "}
        <Link
          to="/monitoring/$pulpDomain/tasks/$taskId"
          params={{ pulpDomain, taskId }}
        >
          task detail
        </Link>{" "}
        page for the error.
      </>
    ),
  });
};
