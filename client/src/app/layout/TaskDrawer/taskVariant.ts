type TaskVariant = "success" | "danger" | "warning" | "info";

const VARIANT_BY_STATE: Record<string, TaskVariant> = {
  completed: "success",
  failed: "danger",
  canceled: "warning",
  canceling: "warning",
};

/** The notification variant for a task state; running, waiting and skipped are info. */
export const taskVariant = (state?: string): TaskVariant =>
  VARIANT_BY_STATE[state ?? ""] ?? "info";
