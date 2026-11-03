import { useNotifications } from "@app/hooks/useNotifications";
import { useTaskTracker } from "@app/hooks/useTaskTracker";
import { notifyTaskStarted } from "@app/utils/taskNotify";

/**
 * Reports a task the user just started: a toast now, and an entry in the task drawer that
 * follows it to the end.
 */
export const useTaskStarted = () => {
  const { addNotification } = useNotifications();
  const { trackTask } = useTaskTracker();
  return ({
    taskHref,
    title = "Task started",
  }: {
    taskHref: string;
    title?: string;
  }) => {
    notifyTaskStarted({ addNotification, taskHref, title });
    trackTask({ taskHref, title });
  };
};
