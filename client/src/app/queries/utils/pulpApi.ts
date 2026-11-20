import { normalizePulpApiRoot } from "@pulp-ui/common";

import type { StatusResponse } from "@app/client";
import type {
  PulpCollection,
  PulpCollections,
  PulpEndpoint,
  PulpHrefActions,
  PulpHrefKind,
  PulpRootEndpoint,
} from "@app/client/pulpEndpoints.gen";
import { DEFAULT_PULP_DOMAIN } from "@app/constants";
import { ENV } from "@app/env";

/** Live API domain: whether pulpcore has DOMAIN_ENABLED, and the active slug. */
export interface IPulpDomain {
  enabled: boolean;
  name: string; // e.g. "default"
}

/** Derive the default domain from a `/status` payload. Pure (no hooks) so callable from a router loader or `useDefaultDomain`. */
export const defaultDomainFromStatus = (
  status: StatusResponse | undefined,
): IPulpDomain => ({
  enabled: status?.domain_enabled ?? false,
  name: DEFAULT_PULP_DOMAIN,
});

const domainSegment = (domain: IPulpDomain): string =>
  domain.enabled ? `/${domain.name}` : "";

/** Strip any leading slash(es) so the endpoint joins with exactly one separator. */
const stripLeadingSlash = (endpoint: string): string =>
  endpoint.replace(/^\/+/, "");

const v3Path = (endpoint: string, domain: IPulpDomain): string =>
  `/api/pulp${domainSegment(domain)}/api/v3/${stripLeadingSlash(endpoint)}`;

/**
 * Build a domain-scoped v3 API path behind the `/api/pulp` proxy marker. The endpoint is
 * checked against the spec (`PulpEndpoint`, relative to `api/v3/`); the domain segment is
 * added only when the server has domains enabled.
 */
export const pulpApiPath = (
  endpoint: PulpEndpoint | `/${PulpEndpoint}`,
  domain: IPulpDomain,
): string => v3Path(endpoint, domain);

/** Build the path of an endpoint outside any domain (`status/`, `livez/`). */
export const pulpRootApiPath = (endpoint: PulpRootEndpoint): string =>
  `/api/pulp/api/v3/${endpoint}`;

/** Every action any apiPath of a plugin collection has (`""` is the collection itself). */
export type PulpCollectionAction<C extends PulpCollection> = {
  [K in keyof PulpCollections[C]]: PulpCollections[C][K];
}[keyof PulpCollections[C]];

/**
 * Build the path of a plugin collection (`remotes/<apiPath>/<action>`) for a type known at
 * runtime, e.g. from the catalog.
 */
export const pulpCollectionPath = <C extends PulpCollection>({
  collection,
  apiPath,
  domain,
  action,
}: {
  collection: C;
  apiPath: string;
  domain: IPulpDomain;
  action?: PulpCollectionAction<C>;
}): string => v3Path(`${collection}/${apiPath}/${action ?? ""}`, domain);

/** Append an action to an href (`{href}sync/`), checked against the href's resource kind. */
export const hrefAction = <K extends PulpHrefKind>({
  href,
  action,
}: {
  kind: K;
  href: string;
  action: PulpHrefActions[K];
}): string => `${toProxyHref(href)}${action}`;

const apiRoot = (): string => normalizePulpApiRoot(ENV.PULP_API_ROOT ?? "");

/**
 * Build a resource href in the server's form (`{API_ROOT}…`) so it shares the cache slot
 * of the API's `pulp_href`. A key: fetch it via `toProxyHref`.
 */
export const pulpHref = (
  endpoint: `${PulpEndpoint}${string}/`,
  domain: IPulpDomain,
): string =>
  `${apiRoot()}${domainSegment(domain)}/api/v3/${stripLeadingSlash(endpoint)}`;

/**
 * Normalize any pulp_href to the `/api/pulp` proxy marker by swapping its `API_ROOT`
 * prefix; idempotent.
 */
export const toProxyHref = (href: string): string => {
  if (href.startsWith("/api/pulp")) return href;
  const root = apiRoot();
  if (href === root || href.startsWith(`${root}/`)) {
    return `/api/pulp${href.slice(root.length)}`;
  }
  return `/api/pulp${href.startsWith("/") ? "" : "/"}${href}`;
};
