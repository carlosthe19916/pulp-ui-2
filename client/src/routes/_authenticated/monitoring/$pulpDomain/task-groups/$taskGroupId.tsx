import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { TaskGroupDetailRoute } from "@app/pages/tasks/task-group-details/TaskGroupDetailRoute";
import {
  buildTaskGroupHref,
  taskGroupDetailQueryOptions,
} from "@app/queries/task-groups";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/monitoring/$pulpDomain/task-groups/$taskGroupId",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, taskGroupId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildTaskGroupHref(taskGroupId, domain);
    await queryClient.ensureQueryData(taskGroupDetailQueryOptions({ href }));
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading task group" />,
  errorComponent: DetailRouteError,
  component: TaskGroupDetailRoute,
});
