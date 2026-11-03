type TaskStateVariant = "success" | "danger" | "warning" | "info";

const VARIANT_BY_STATE: Record<string, TaskStateVariant> = {
  completed: "success",
  failed: "danger",
  canceled: "warning",
  canceling: "warning",
};

/** The notification variant for a task state; running, waiting and skipped are info. */
export const taskStateVariant = (state?: string): TaskStateVariant =>
  VARIANT_BY_STATE[state ?? ""] ?? "info";
