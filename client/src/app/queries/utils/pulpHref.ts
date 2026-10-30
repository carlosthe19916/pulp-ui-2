import type { EntityType } from "@catalog";

import {
  getPlugin,
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

/** Resolve a CRUD href (`…/<family>/<app>/<slug>/<pk>/`) to its entity and pulp_type. */
const resolveCrudHref = (
  href: string | null | undefined,
): { entity: EntityType; pulpType: string } | undefined => {
  const match = href?.match(
    /\/(repositories|remotes|distributions|publications)\/([^/]+)\/([^/]+)\//,
  );
  if (!match) return undefined;
  const entity = FAMILY_TO_ENTITY[match[1]];
  // `<app>/<slug>` maps back to the pulp_type, e.g. `file/file` to `file.file`.
  const pulpType = resolvePulpTypeByApiPath({
    entity,
    apiPath: `${match[2]}/${match[3]}`,
  });
  return pulpType ? { entity, pulpType } : undefined;
};

/**
 * Resolve a resource's catalog pulp_type from its `pulp_href`
 * (`…/<family>/<app>/<slug>/<pk>/`); undefined for aggregate or uncatalogued hrefs.
 */
export const resolvePulpType = (
  href: string | null | undefined,
): string | undefined => {
  // Content is its own axis (a plugin owns many content types); CRUD entities use
  // the per-entity apiPath index.
  const content = href?.match(/\/content\/([^/]+)\/([^/]+)\//);
  if (content)
    return resolveContentTypeByApiPath({
      apiPath: `${content[1]}/${content[2]}`,
    });
  return resolveCrudHref(href)?.pulpType;
};

/**
 * Whether a resource exposes per-object role endpoints (`my_permissions/` etc.). Role
 * support is per entity+type: some modelled types are read-only for RBAC (hugging_face,
 * OpenPGP distributions), and unmodelled ones (`core.artifact`) have none — all 404.
 */
export const hasRoleEndpoints = (href: string | null | undefined): boolean => {
  const resolved = resolveCrudHref(href);
  if (!resolved) return false;
  return (
    getPlugin(resolved.pulpType)?.entities[resolved.entity]?.rolesManaged !==
    false
  );
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
