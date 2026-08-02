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

/** Build a file repository pulp_href from a repository ID. */
export function buildRepositoryHref(repoId: string): string {
  return `/api/pulp/${PULP_DOMAIN}/api/v3/repositories/file/file/${repoId}/`;
}

/** Build a file remote pulp_href from a remote ID. */
export function buildRemoteHref(remoteId: string): string {
  return `/api/pulp/${PULP_DOMAIN}/api/v3/remotes/file/file/${remoteId}/`;
}

/** Build a file distribution pulp_href from a distribution ID. */
export function buildDistributionHref(distId: string): string {
  return `/api/pulp/${PULP_DOMAIN}/api/v3/distributions/file/file/${distId}/`;
}

/** Build a file publication pulp_href from a publication ID. */
export function buildPublicationHref(pubId: string): string {
  return `/api/pulp/${PULP_DOMAIN}/api/v3/publications/file/file/${pubId}/`;
}

/** Build a file content pulp_href from a content ID. */
export function buildContentHref(contentId: string): string {
  return `/api/pulp/${PULP_DOMAIN}/api/v3/content/file/files/${contentId}/`;
}

/** Extract the trailing ID (last path segment) from any pulp_href. */
export function extractIdFromHref(href: string): string {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
}

/**
 * Build a consumer download URL for a unit served by a distribution.
 * Joins `base_url` and `relative_path` with normalized slashes.
 */
export function buildDistributionContentUrl(
  baseUrl: string,
  relativePath: string,
): string {
  const base = baseUrl.replace(/\/+$/, "");
  const path = relativePath.replace(/^\/+/, "");
  return `${base}/${path}`;
}
