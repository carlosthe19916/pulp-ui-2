import { useNotifications } from "@app/hooks/useNotifications";
import type { IWriteResult } from "@app/queries/tasks";
import { useTrackedTasksStore } from "@app/stores/useTrackedTasksStore";
import { notifyTaskStarted } from "@app/utils/taskNotify";

export interface IReportWriteParams {
  /** What a `200 | 202` write returned: its object, or the task it started. */
  result: IWriteResult<unknown>;
  /** When it applied at once (`200`), e.g. `Remote "foo" updated`. */
  finishedTitle: string;
  /** When it started a task (`202`), which goes to the task drawer. */
  startedTitle: string;
}

/**
 * Reports a write to the user (ADR 0006): `reportStarted` for one that started a Pulp task,
 * which goes to the task drawer; `reportWrite` for a `200 | 202` write, which reports the
 * change or the task it started.
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
    if (result.kind === "task") {
      reportStarted({ taskHref: result.taskHref, title: startedTitle });
    } else {
      addNotification({ title: finishedTitle, variant: "success" });
    }
  };

  return { reportStarted, reportWrite };
};
