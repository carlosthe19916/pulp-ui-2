import { PULP_DOMAIN } from "@app/Constants";

/** Build a Pulp user pulp_href from a user ID. */
export function buildUserHref(userId: string): string {
  return `/api/pulp/${PULP_DOMAIN}/api/v3/users/${userId}/`;
}

/** Build a Pulp group pulp_href from a group ID. */
export function buildGroupHref(groupId: string): string {
  return `/api/pulp/${PULP_DOMAIN}/api/v3/groups/${groupId}/`;
}

/** Build a Pulp role pulp_href from a role ID. */
export function buildRoleHref(roleId: string): string {
  return `/api/pulp/${PULP_DOMAIN}/api/v3/roles/${roleId}/`;
}

/** Extract the trailing ID (last path segment) from any pulp_href. */
export function extractIdFromHref(href: string): string {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
}
