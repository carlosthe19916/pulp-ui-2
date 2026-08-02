import { createFileRoute } from "@tanstack/react-router";

import { TaskDetailRoute } from "@app/pages/platform/tasks/TaskDetailRoute";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  component: TaskDetailRoute,
});
