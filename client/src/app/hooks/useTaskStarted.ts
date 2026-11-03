import { useNotifications } from "@app/hooks/useNotifications";
import { useTrackedTasksStore } from "@app/stores/useTrackedTasksStore";
import { notifyTaskStarted } from "@app/utils/taskNotify";

/**
 * Reports a task the user just started: a toast now, and an entry in the task drawer that
 * follows it to the end.
 */
export const useTaskStarted = () => {
  const { addNotification } = useNotifications();
  const track = useTrackedTasksStore((state) => state.track);
  return ({
    taskHref,
    title = "Task started",
  }: {
    taskHref: string;
    title?: string;
  }) => {
    notifyTaskStarted({ addNotification, taskHref, title });
    track({ taskHref, title });
  };
};
