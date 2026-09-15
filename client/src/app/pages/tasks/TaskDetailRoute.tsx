import { getRouteApi } from "@tanstack/react-router";

import { TaskDetail } from "./TaskDetail";

const taskDetailRouteApi = getRouteApi("/_authenticated/tasks/$taskId");

export const TaskDetailRoute = () => {
  const { taskId } = taskDetailRouteApi.useParams();
  return <TaskDetail taskId={taskId} />;
};
