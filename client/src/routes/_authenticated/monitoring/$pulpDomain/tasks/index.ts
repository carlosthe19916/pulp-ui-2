import { createFileRoute } from "@tanstack/react-router";

import { TASKS_TABLE_STATE } from "@app/components/TasksTable";
import { TaskList } from "@app/pages/tasks/task-list/TaskList";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(TASKS_TABLE_STATE);

export const Route = createFileRoute(
  "/_authenticated/monitoring/$pulpDomain/tasks/",
)({
  validateSearch,
  search,
  component: TaskList,
});
