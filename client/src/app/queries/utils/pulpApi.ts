import { normalizePulpApiRoot } from "@pulp-ui/common";

import { DEFAULT_PULP_DOMAIN } from "@app/Constants";
import type { StatusResponse } from "@app/client";
import ENV from "@app/env";

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

/**
 * Build a domain-scoped v3 API path behind the fixed `/api/pulp` proxy marker.
 * Leading slash on `endpoint` optional; trailing slash preserved (Pulp URLs are
 * trailing-slash-significant).
 */
export const pulpApiPath = (endpoint: string, domain: IPulpDomain): string =>
  `/api/pulp${domainSegment(domain)}/api/v3/${stripLeadingSlash(endpoint)}`;

const apiRoot = (): string => normalizePulpApiRoot(ENV.PULP_API_ROOT ?? "");

/**
 * Build a resource href in the server's own form (`{API_ROOT}…`), identical to the
 * `pulp_href` the API returns — so an href rebuilt from a route id shares the cache
 * slot (and invalidation) of one read from a response. A key, not a request URL:
 * fetch it through `toProxyHref`.
 */
export const pulpHref = (endpoint: string, domain: IPulpDomain): string =>
  `${apiRoot()}${domainSegment(domain)}/api/v3/${stripLeadingSlash(endpoint)}`;

/**
 * Normalize any pulp_href to the fixed `/api/pulp` proxy marker (routed to the
 * backend's real `API_ROOT`). Idempotent: `pulpApiPath` URLs pass through; server
 * hrefs (`pulp_href`, `pulpHref`) get their `API_ROOT` prefix swapped for `/api/pulp`.
 */
export const toProxyHref = (href: string): string => {
  if (href.startsWith("/api/pulp")) return href;
  const root = apiRoot();
  if (href === root || href.startsWith(`${root}/`)) {
    return `/api/pulp${href.slice(root.length)}`;
  }
  return `/api/pulp${href.startsWith("/") ? "" : "/"}${href}`;
};
