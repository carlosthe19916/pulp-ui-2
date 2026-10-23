import { createFileRoute } from "@tanstack/react-router";

import { TaskScheduleList } from "@app/pages/tasks/task-schedule-list/TaskScheduleList";

export const Route = createFileRoute(
  "/_authenticated/monitoring/$pulpDomain/task-schedules/",
)({
  component: TaskScheduleList,
});
