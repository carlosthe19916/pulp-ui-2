import { useNotifications } from "@app/hooks/useNotifications";
import type { ISettledWrite } from "@app/queries/tasks";
import { useTrackedTasksStore } from "@app/stores/useTrackedTasksStore";
import { notifyTaskStarted } from "@app/utils/taskNotify";

export interface ITaskSettledFeedback {
  /** What a configuration write resolved to: its task (waited for), or its object. */
  result: ISettledWrite<unknown>;
  /** When the write is done, e.g. `Remote "foo" deleted`. */
  doneTitle: string;
  /** When its task is still running and moves to the task drawer. */
  startedTitle: string;
}

/**
 * What the user is told about a write that runs as a Pulp task (ADR 0017): `started` for
 * data work, which goes to the task drawer; `settled` for a configuration write, which
 * reports its outcome, or hands over to the drawer if its task is still running.
 */
export const useTaskFeedback = () => {
  const { addNotification } = useNotifications();
  const track = useTrackedTasksStore((state) => state.track);

  const started = ({
    taskHref,
    title = "Task started",
  }: {
    taskHref: string;
    title?: string;
  }) => {
    notifyTaskStarted({ addNotification, taskHref, title });
    track({ taskHref, title });
  };

  const settled = ({
    result,
    doneTitle,
    startedTitle,
  }: ITaskSettledFeedback) => {
    if (result.kind === "task" && !result.finished) {
      started({ taskHref: result.taskHref, title: startedTitle });
    } else {
      addNotification({ title: doneTitle, variant: "success" });
    }
  };

  return { started, settled };
};
