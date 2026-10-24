import type { EntityType } from "@catalog";

import {
  resolveContentTypeByApiPath,
  resolvePulpTypeByApiPath,
} from "@catalog";

import type { IPulpDomain } from "./pulpApi";
import { pulpHref } from "./pulpApi";

/** URL collection family (first href segment) → catalog entity type (CRUD only). */
const FAMILY_TO_ENTITY: Record<string, EntityType> = {
  repositories: "repository",
  remotes: "remote",
  distributions: "distribution",
  publications: "publication",
};

/**
 * Resolve a resource's catalog pulp_type from its `pulp_href`
 * (`…/<family>/<app>/<slug>/<pk>/`); undefined for aggregate or uncatalogued hrefs.
 */
export const resolvePulpType = (
  href: string | null | undefined,
): string | undefined => {
  if (!href) return undefined;
  const match = href.match(
    /\/(repositories|remotes|distributions|publications|content)\/([^/]+)\/([^/]+)\//,
  );
  if (!match) return undefined;
  // `<app>/<slug>` maps back to the pulp_type, e.g. `file/files` to `file.file`.
  const apiPath = `${match[2]}/${match[3]}`;
  // Content is its own axis (a plugin owns many content types); CRUD entities use
  // the per-entity apiPath index.
  if (match[1] === "content") return resolveContentTypeByApiPath({ apiPath });
  return resolvePulpTypeByApiPath({
    entity: FAMILY_TO_ENTITY[match[1]],
    apiPath,
  });
};

export const buildGroupHref = (
  groupId: string,
  domain: IPulpDomain,
): string => {
  return pulpHref(`groups/${groupId}/`, domain);
};

export const buildUserHref = (userId: string, domain: IPulpDomain): string => {
  return pulpHref(`users/${userId}/`, domain);
};

export const extractIdFromHref = (href: string): string => {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
};

/**
 * Split a repository-version href into its repository href (server form, so it shares
 * `repositoryKeys.detail`'s slot) and version number.
 */
export const parseRepositoryVersionHref = (
  href: string,
): { repositoryHref: string; number: string } | undefined => {
  const match = href.match(/^(.*\/)versions\/(\d+)\/?$/);
  return match ? { repositoryHref: match[1], number: match[2] } : undefined;
};
