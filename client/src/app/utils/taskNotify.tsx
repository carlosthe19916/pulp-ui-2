import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { extractTaskId } from "./taskHref";

interface NotifyFn {
  (notification: {
    title: string;
    variant: "success" | "danger" | "warning" | "info" | "custom";
    description?: ReactNode;
  }): void;
}

/** Toast helper for task-producing operations (202 responses). */
export function notifyTaskStarted(
  addNotification: NotifyFn,
  taskHref: string,
  title = "Task started",
) {
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
}
