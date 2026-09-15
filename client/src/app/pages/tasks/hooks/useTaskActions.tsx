import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useTaskCancelMutation,
  useTaskPurgeMutation,
} from "@app/queries/tasks";

/**
 * Binds the task cancel/purge mutations to toast notifications. Cancel and
 * purge are asynchronous requests, so they surface an info toast (or a
 * task-started toast for the purge task). Each action rethrows on failure so
 * callers can keep a modal open on error.
 */
export const useTaskActions = () => {
  const { runAction } = useMutationAction();
  const cancelMutation = useTaskCancelMutation();
  const purgeMutation = useTaskPurgeMutation();

  const cancelTask = async (href: string) =>
    runAction(() => cancelMutation.mutateAsync(href), {
      successTitle: "Task cancel requested",
      successVariant: "info",
      errorTitle: "Failed to cancel task",
    });

  const purgeTasks = async () =>
    runAction(
      () =>
        purgeMutation.mutateAsync({
          states: ["completed", "failed", "canceled", "skipped"],
        }),
      {
        taskAware: true,
        taskTitle: "Purge task started",
        successTitle: "Purge requested",
        successVariant: "info",
        errorTitle: "Failed to purge tasks",
      },
    );

  return {
    cancelTask,
    purgeTasks,
    isCanceling: cancelMutation.isPending,
    isPurging: purgeMutation.isPending,
  };
};
