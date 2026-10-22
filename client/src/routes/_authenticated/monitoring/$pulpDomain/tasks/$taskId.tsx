import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { TaskDetailRoute } from "@app/pages/tasks/task-details/TaskDetailRoute";
import { taskDetailQueryOptions } from "@app/queries/tasks";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";
import { buildTaskHref } from "@app/utils/taskHref";

export const Route = createFileRoute(
  "/_authenticated/monitoring/$pulpDomain/tasks/$taskId",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, taskId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildTaskHref(taskId, domain);
    await queryClient.ensureQueryData(
      taskDetailQueryOptions({ taskHref: href }),
    );
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading task..." />,
  errorComponent: DetailRouteError,
  component: TaskDetailRoute,
});
