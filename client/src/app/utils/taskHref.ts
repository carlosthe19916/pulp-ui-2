import { PULP_DOMAIN } from "@app/Constants";

/** Build a Pulp task pulp_href from a task UUID. */
export function buildTaskHref(taskId: string): string {
  return `/api/pulp/${PULP_DOMAIN}/api/v3/tasks/${taskId}/`;
}

/** Extract the trailing UUID (or last path segment) from a pulp_href. */
export function extractTaskId(href: string): string {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
}
