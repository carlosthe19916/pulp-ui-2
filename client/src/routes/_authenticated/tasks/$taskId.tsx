import { createFileRoute } from "@tanstack/react-router";

import { TaskDetailRoute } from "@app/pages/tasks/TaskDetailRoute";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  component: TaskDetailRoute,
});
