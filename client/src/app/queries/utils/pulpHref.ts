import {
  resolveContentTypeByApiPath,
  resolvePulpTypeByApiPath,
} from "@catalog";
import type { EntityType } from "@catalog";

import { pulpHref } from "./pulpApi";
import type { IPulpDomain } from "./pulpApi";

/** URL collection family (first href segment) → catalog entity type (CRUD only). */
const FAMILY_TO_ENTITY: Record<string, EntityType> = {
  repositories: "repository",
  remotes: "remote",
  distributions: "distribution",
  publications: "publication",
};

/**
 * Resolve a resource's catalog pulp_type from its `pulp_href` alone. A typed href
 * is `.../<family>/<app>/<slug>/<pk>/`; `<app>/<slug>` is the catalog `apiPath`,
 * reverse-mapped per family to the pulp_type the app keys on (`getPlugin`).
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

export const extractIdFromHref = (href: string): string => {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
};
