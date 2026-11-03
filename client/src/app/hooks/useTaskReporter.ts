import { useNotifications } from "@app/hooks/useNotifications";
import type { IWriteResult } from "@app/queries/tasks";
import { useTrackedTasksStore } from "@app/stores/useTrackedTasksStore";
import { notifyTaskStarted } from "@app/utils/taskNotify";

export interface IReportWriteParams {
  /** What a configuration write resolved to: its task (waited for), or its object. */
  result: IWriteResult<unknown>;
  /** When the write finished, e.g. `Remote "foo" deleted`. */
  finishedTitle: string;
  /** When its task is still running and moves to the task drawer. */
  startedTitle: string;
}

/**
 * Reports a write that runs as a Pulp task to the user (ADR 0006): `reportStarted`
 * for data work, which goes to the task drawer; `reportWrite` for a configuration write,
 * which reports its outcome, or hands over to the drawer if its task is still running.
 */
export const useTaskReporter = () => {
  const { addNotification } = useNotifications();
  const track = useTrackedTasksStore((state) => state.track);

  const reportStarted = ({
    taskHref,
    title = "Task started",
  }: {
    taskHref: string;
    title?: string;
  }) => {
    notifyTaskStarted({ addNotification, taskHref, title });
    track({ taskHref, title });
  };

  const reportWrite = ({
    result,
    finishedTitle,
    startedTitle,
  }: IReportWriteParams) => {
    if (result.kind === "task" && !result.finished) {
      reportStarted({ taskHref: result.taskHref, title: startedTitle });
    } else {
      addNotification({ title: finishedTitle, variant: "success" });
    }
  };

  return { reportStarted, reportWrite };
};
