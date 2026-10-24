import type React from "react";

import { getRouteApi } from "@tanstack/react-router";

import { TaskDetail } from "./TaskDetail";

const taskDetailRouteApi = getRouteApi(
  "/_authenticated/monitoring/$pulpDomain/tasks/$taskId",
);

export const TaskDetailRoute: React.FC = () => {
  const { href } = taskDetailRouteApi.useLoaderData();
  return <TaskDetail taskHref={href} />;
};
