import { getRouteApi } from "@tanstack/react-router";

import { TaskGroupDetail } from "./TaskGroupDetail";

const routeApi = getRouteApi(
  "/_authenticated/monitoring/$pulpDomain/task-groups/$taskGroupId",
);

export const TaskGroupDetailRoute = () => {
  const { href } = routeApi.useLoaderData();
  return <TaskGroupDetail href={href} />;
};
