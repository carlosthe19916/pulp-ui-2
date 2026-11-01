import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { TASKS_TABLE_STATE } from "@app/components/TasksTable";
import { TaskGroupDetailRoute } from "@app/pages/tasks/task-group-details/TaskGroupDetailRoute";
import {
  buildTaskGroupHref,
  taskGroupDetailQueryOptions,
} from "@app/queries/task-groups";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(TASKS_TABLE_STATE);

export const Route = createFileRoute(
  "/_authenticated/monitoring/$pulpDomain/task-groups/$taskGroupId",
)({
  validateSearch,
  search,
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, taskGroupId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildTaskGroupHref(taskGroupId, domain);
    await queryClient.query({
      ...taskGroupDetailQueryOptions({ href }),
      staleTime: "static",
    });
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading task group" />,
  errorComponent: DetailRouteError,
  component: TaskGroupDetailRoute,
});
