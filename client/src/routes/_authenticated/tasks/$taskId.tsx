import { createFileRoute } from "@tanstack/react-router";

import { TaskDetailRoute } from "@app/pages/tasks/task-details/TaskDetailRoute";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  component: TaskDetailRoute,
});
