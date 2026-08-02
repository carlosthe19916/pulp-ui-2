import { PULP_DOMAIN } from "@app/Constants";

/**
 * Infer a pulp_type (e.g. `file.file`) from a typed resource pulp_href when the
 * aggregation API omits `pulp_type`.
 */
export function inferPulpTypeFromHref(
  href: string | null | undefined,
): string | undefined {
  if (!href) return undefined;

  const typed = href.match(
    /\/(?:repositories|remotes|distributions|publications)\/([^/]+)\/([^/]+)\//,
  );
  if (typed) {
    return `${typed[1]}.${typed[2]}`;
  }

  const content = href.match(/\/content\/([^/]+)\/([^/]+)\//);
  if (content) {
    const plugin = content[1];
    const type = content[2].endsWith("s")
      ? content[2].slice(0, -1)
      : content[2];
    return `${plugin}.${type}`;
  }

  return undefined;
}

/** Prefer an explicit pulp_type, otherwise infer from the resource href. */
export function resolvePulpType(
  pulpType: string | null | undefined,
  href: string | null | undefined,
): string | undefined {
  return pulpType || inferPulpTypeFromHref(href);
}

/** True when a detail payload is missing or an empty object (`data ?? {}`). */
export function isEmptyDetailPayload(
  data: unknown,
): data is null | undefined | Record<string, never> {
  if (data == null) return true;
  if (typeof data !== "object") return false;
  return Object.keys(data as object).length === 0;
}

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
