import { createFileRoute } from "@tanstack/react-router";

import { TaskList } from "@app/pages/platform/tasks/TaskList";

export const Route = createFileRoute("/_authenticated/tasks/")({
  component: TaskList,
});
