import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { extractTaskId } from "./taskHref";

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
  addNotification({
    title,
    variant: "info",
    description: (
      <>
        Track progress on the{" "}
        <Link to="/tasks/$taskId" params={{ taskId }}>
          task detail
        </Link>{" "}
        page.
      </>
    ),
  });
};
