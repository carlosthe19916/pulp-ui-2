import { createFileRoute } from "@tanstack/react-router";

import { TaskList } from "@app/pages/tasks/TaskList";

export const Route = createFileRoute("/_authenticated/tasks/")({
  component: TaskList,
});
