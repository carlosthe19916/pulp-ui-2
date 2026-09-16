import type { NotificationVariant } from "@app/context/notifications-context";
import { useNotifications } from "@app/context/useNotifications";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

/** Async operations that may return a Pulp task href (202 responses). */
type TaskProducing = { task?: string | null };

interface IRunActionOptions<TResult> {
  /** Success toast title; a function form can interpolate result fields. */
  successTitle: string | ((result: TResult) => string);
  errorTitle: string;
  successVariant?: NotificationVariant;
  /** When set, show a task-started toast if the result carries a `task` href. */
  taskAware?: boolean;
  taskTitle?: string;
}

/**
 * Binds an async mutation to success/error toasts and **rethrows** so callers
 * can keep a modal open. Success is task-aware for 202 responses.
 */
export const useMutationAction = () => {
  const { addNotification } = useNotifications();

  const runAction = async <TResult,>(
    action: () => Promise<TResult>,
    {
      successTitle,
      errorTitle,
      successVariant = "success",
      taskAware = false,
      taskTitle,
    }: IRunActionOptions<TResult>,
  ): Promise<TResult> => {
    try {
      const result = await action();
      const title =
        typeof successTitle === "function"
          ? successTitle(result)
          : successTitle;
      const taskHref =
        taskAware && result != null
          ? (result as TaskProducing).task
          : undefined;
      if (taskHref) {
        notifyTaskStarted(addNotification, taskHref, taskTitle ?? title);
      } else {
        addNotification({ title, variant: successVariant });
      }
      return result;
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, errorTitle),
        variant: "danger",
      });
      throw error;
    }
  };

  return { runAction };
};
