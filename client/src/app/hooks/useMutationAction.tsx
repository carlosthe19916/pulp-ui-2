import type { NotificationVariant } from "@app/context/notifications-context";
import { useNotifications } from "@app/context/useNotifications";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

/** Async operations that may return a Pulp task href (202 responses). */
type TaskProducing = { task?: string | null };

interface IRunActionOptions<TResult> {
  /**
   * Toast title on success (non-task path). May be a function of the result to
   * interpolate server-returned fields (e.g. the created record's name).
   */
  successTitle: string | ((result: TResult) => string);
  /** Fallback title for the error toast. */
  errorTitle: string;
  /** Variant for the plain success toast (default `"success"`). */
  successVariant?: NotificationVariant;
  /**
   * When true, if the result carries a `task` href a task-started toast is
   * shown instead of the plain success toast.
   */
  taskAware?: boolean;
  /** Title for the task-started toast (defaults to `successTitle`). */
  taskTitle?: string;
}

/**
 * Binds an async mutation call to success/error toast notifications with a
 * consistent contract: toast on success (optionally task-aware for 202
 * responses), toast on failure, and **rethrow** so callers can keep a modal
 * open. Per-page `useXActions` hooks build on this to avoid repeating the
 * try/toast/rethrow wiring. Mirrors the shape of `useUserActions`.
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
