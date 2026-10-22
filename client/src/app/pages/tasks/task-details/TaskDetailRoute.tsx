import { getRouteApi } from "@tanstack/react-router";

import { TaskDetail } from "./TaskDetail";

const taskDetailRouteApi = getRouteApi(
  "/_authenticated/monitoring/$pulpDomain/tasks/$taskId",
);

export const TaskDetailRoute = () => {
  const { href } = taskDetailRouteApi.useLoaderData();
  return <TaskDetail taskHref={href} />;
};
