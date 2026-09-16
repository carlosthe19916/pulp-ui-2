import { pulpApiPath } from "./pulpApi";
import type { IPulpDomain } from "./pulpApi";

/** Infer a pulp_type (e.g. `file.file`) from a typed resource pulp_href when the API omits `pulp_type`. */
export const inferPulpTypeFromHref = (
  href: string | null | undefined,
): string | undefined => {
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
};

/** Prefer an explicit pulp_type, otherwise infer from the resource href. */
export const resolvePulpType = (
  pulpType: string | null | undefined,
  href: string | null | undefined,
): string | undefined => {
  return pulpType || inferPulpTypeFromHref(href);
};

/** True when a detail payload is missing or an empty object (`data ?? {}`). */
export const isEmptyDetailPayload = (
  data: unknown,
): data is null | undefined | Record<string, never> => {
  if (data == null) return true;
  if (typeof data !== "object") return false;
  return Object.keys(data as object).length === 0;
};

export const buildUserHref = (userId: string, domain: IPulpDomain): string => {
  return pulpApiPath(`users/${userId}/`, domain);
};

export const buildGroupHref = (
  groupId: string,
  domain: IPulpDomain,
): string => {
  return pulpApiPath(`groups/${groupId}/`, domain);
};

export const buildRoleHref = (roleId: string, domain: IPulpDomain): string => {
  return pulpApiPath(`roles/${roleId}/`, domain);
};

export const buildRepositoryHref = (
  repoId: string,
  domain: IPulpDomain,
): string => {
  return pulpApiPath(`repositories/file/file/${repoId}/`, domain);
};

export const buildRemoteHref = (
  remoteId: string,
  domain: IPulpDomain,
): string => {
  return pulpApiPath(`remotes/file/file/${remoteId}/`, domain);
};

export const buildDistributionHref = (
  distId: string,
  domain: IPulpDomain,
): string => {
  return pulpApiPath(`distributions/file/file/${distId}/`, domain);
};

export const buildPublicationHref = (
  pubId: string,
  domain: IPulpDomain,
): string => {
  return pulpApiPath(`publications/file/file/${pubId}/`, domain);
};

export const buildContentHref = (
  contentId: string,
  domain: IPulpDomain,
): string => {
  return pulpApiPath(`content/file/files/${contentId}/`, domain);
};

export const extractIdFromHref = (href: string): string => {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
};

/** Join a distribution `base_url` and `relative_path` into a download URL. */
export const buildDistributionContentUrl = (
  baseUrl: string,
  relativePath: string,
): string => {
  const base = baseUrl.replace(/\/+$/, "");
  const path = relativePath.replace(/^\/+/, "");
  return `${base}/${path}`;
};
