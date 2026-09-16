import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { TaskDetailRoute } from "@app/pages/tasks/task-details/TaskDetailRoute";
import { taskDetailQueryOptions } from "@app/queries/tasks";
import { buildTaskHref } from "@app/utils/taskHref";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  loader: async ({ context: { queryClient }, params: { taskId } }) => {
    await queryClient.ensureQueryData(
      taskDetailQueryOptions(buildTaskHref(taskId)),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading task..." />,
  errorComponent: DetailRouteError,
  component: TaskDetailRoute,
});
