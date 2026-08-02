import { createFileRoute } from "@tanstack/react-router";

import { TaskDetail } from "@app/pages/platform/tasks/TaskDetail";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  component: TaskDetailRoute,
});

function TaskDetailRoute() {
  const { taskId } = Route.useParams();
  return <TaskDetail taskId={taskId} />;
}
