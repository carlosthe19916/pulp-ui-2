import { DEFAULT_PULP_DOMAIN } from "@app/Constants";

export const buildTaskHref = (taskId: string): string => {
  return `/api/pulp/${DEFAULT_PULP_DOMAIN}/api/v3/tasks/${taskId}/`;
};

export const extractTaskId = (href: string): string => {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
};

/** Last dot-segment of a Pulp task name (`pulp_file.app.tasks.synchronize` → `synchronize`). */
export const shortTaskName = (name: string): string =>
  name.split(".").pop() || name;
