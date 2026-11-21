import type { TaskResponse } from "@app/client";
import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import type { ITaskListParams } from "@app/queries/tasks";

export const TASK_STATES = ["failed", "running", "waiting"] as const;
export type AssistantTaskState = (typeof TASK_STATES)[number];

/** The newest tasks in one state, sized like a picker, shared by the tool and its card. */
export const taskListParams = ({
  state,
  name,
}: {
  state: AssistantTaskState;
  name?: string;
}): ITaskListParams => ({
  state,
  name__contains: name || undefined,
  ordering: state === "failed" ? "-finished_at" : "-pulp_created",
  limit: DROPDOWN_PAGE_SIZE,
  offset: 0,
  fields: [
    "pulp_href",
    "name",
    "state",
    "pulp_created",
    "unblocked_at",
    "started_at",
    "finished_at",
    "error",
    "progress_reports",
    "reserved_resources_record",
  ],
});

/**
 * Why a waiting task hasn't started: Pulp unblocks it once no earlier task holds its
 * resources, then it waits for a free worker.
 */
export const waitingReason = (task: TaskResponse): string =>
  task.unblocked_at
    ? "Waiting for a free worker"
    : "Blocked by an earlier task on the same resources";

/** The progress report still moving, or the last one. */
export const currentProgress = (task: TaskResponse): string | undefined => {
  const reports = task.progress_reports ?? [];
  const report =
    reports.find((candidate) => candidate.state === "running") ??
    reports.at(-1);
  if (!report?.message) return undefined;
  return report.total
    ? `${report.message}: ${report.done ?? 0} of ${report.total}`
    : `${report.message}: ${report.done ?? 0}`;
};
