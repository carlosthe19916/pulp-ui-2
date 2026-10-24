import { DEFAULT_PULP_DOMAIN } from "@app/constants";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";
import { pulpHref } from "@app/queries/utils/pulpApi";

export const buildTaskHref = ({
  taskId,
  domain,
}: {
  taskId: string;
  domain: IPulpDomain;
}): string => pulpHref(`tasks/${taskId}/`, domain);

export const extractTaskId = (href: string): string => {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
};

/**
 * Pulp domain slug from a task href (`…/<domain>/api/v3/tasks/<id>/`); the default domain
 * for the domains-disabled form.
 */
export const extractTaskDomain = (href: string): string => {
  const parts = href.split("/").filter(Boolean);
  const apiIdx = parts.findIndex(
    (p, i) => p === "api" && parts[i + 1] === "v3",
  );
  if (apiIdx <= 0) return DEFAULT_PULP_DOMAIN;
  const before = parts[apiIdx - 1];
  return before === "pulp"
    ? DEFAULT_PULP_DOMAIN
    : (before ?? DEFAULT_PULP_DOMAIN);
};

/** Last dot-segment of a Pulp task name (`pulp_file.app.tasks.synchronize` → `synchronize`). */
export const shortTaskName = (name: string): string =>
  name.split(".").pop() || name;
