import { resolvePulpTypeByApiPath } from "@catalog";
import type { EntityType } from "@catalog";

import { pulpApiPath } from "./pulpApi";
import type { IPulpDomain } from "./pulpApi";

/** URL collection family (first href segment) → catalog entity type. */
const FAMILY_TO_ENTITY: Record<string, EntityType> = {
  repositories: "repository",
  remotes: "remote",
  distributions: "distribution",
  publications: "publication",
  content: "content",
};

/**
 * Resolve a resource's catalog pulp_type from its `pulp_href` alone. A typed href
 * is `.../<family>/<app>/<slug>/<pk>/`; `<app>/<slug>` is the catalog `apiPath`,
 * reverse-mapped per family to the pulp_type the app keys on (`getEntityPlugin`).
 *
 * @example
 * resolvePulpType("/api/pulp/default/api/v3/repositories/rpm/rpm/0190.../") // "rpm.rpm"
 * resolvePulpType("/distributions/python/pypi/0190.../") // "python.pypi"
 * resolvePulpType("/content/file/files/0190.../") // "file.file" (not "file.files")
 * resolvePulpType("/repositories/") // undefined — aggregate, no <app>/<slug>
 * resolvePulpType("/repositories/mystery/x/") // undefined — plugin not in catalog
 * resolvePulpType(undefined) // undefined
 */
export const resolvePulpType = (
  href: string | null | undefined,
): string | undefined => {
  if (!href) return undefined;
  const match = href.match(
    /\/(repositories|remotes|distributions|publications|content)\/([^/]+)\/([^/]+)\//,
  );
  if (!match) return undefined;
  const entity = FAMILY_TO_ENTITY[match[1]];
  return resolvePulpTypeByApiPath(entity, `${match[2]}/${match[3]}`);
};

export const buildUserHref = (userId: string, domain: IPulpDomain): string => {
  return pulpApiPath(`users/${userId}/`, domain);
};

export const buildDomainHref = (
  domainId: string,
  domain: IPulpDomain,
): string => {
  return pulpApiPath(`domains/${domainId}/`, domain);
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
