import { extractIdFromHref } from "@app/queries/utils/pulpHref";

/**
 * Best-effort human identifier for a content unit across plugins. The aggregate
 * `/content/` list is sparse, so prefer `relative_path`, then `name`, and finally
 * fall back to the id extracted from the unit's href.
 */
export const contentIdentifier = (unit: Record<string, unknown>): string => {
  const relativePath = unit.relative_path;
  if (typeof relativePath === "string" && relativePath) return relativePath;
  const name = unit.name;
  if (typeof name === "string" && name) return name;
  const href = unit.pulp_href;
  return typeof href === "string" ? extractIdFromHref(href) : "—";
};
