import { createFileRoute } from "@tanstack/react-router";

import { TaskScheduleList } from "@app/pages/tasks/task-schedule-list/TaskScheduleList";
import { TASK_SCHEDULE_LIST_STATE } from "@app/pages/tasks/task-schedule-list/taskScheduleListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(TASK_SCHEDULE_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/monitoring/$pulpDomain/task-schedules/",
)({
  validateSearch,
  search,
  component: TaskScheduleList,
});
