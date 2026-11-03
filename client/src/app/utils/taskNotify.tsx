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

export interface INotifyUpdateResultOptions {
  addNotification: INotifyFn;
  /** Reports a started task (`useTaskStarted`). */
  taskStarted: (task: { taskHref: string; title: string }) => void;
  /** The update response: a task (202) or the updated object (200). */
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
  if ("task" in data && typeof data.task === "string") {
    taskStarted({ taskHref: data.task, title: `${subject} update started` });
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
