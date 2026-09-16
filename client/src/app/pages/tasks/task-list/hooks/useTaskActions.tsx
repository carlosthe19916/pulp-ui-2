import { useMutationAction } from "@app/hooks/useMutationAction";
import {
  useTaskCancelMutation,
  useTaskPurgeMutation,
} from "@app/queries/tasks";

/** Cancel/purge tasks with toasts; each action rethrows so callers can keep a modal open. */
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
