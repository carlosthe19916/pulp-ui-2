import { normalizePulpApiRoot } from "@pulp-ui/common";

import ENV from "@app/env";

/** Live API domain: whether pulpcore has DOMAIN_ENABLED, and the active slug. */
export interface IPulpDomain {
  enabled: boolean;
  name: string; // e.g. "default"
}

/** Domain path segment: "/default" when enabled, "" when disabled. */
const domainSegment = (domain: IPulpDomain): string =>
  domain.enabled ? `/${domain.name}` : "";

/** Strip any leading slash(es) so the endpoint joins with exactly one separator. */
const stripLeadingSlash = (endpoint: string): string =>
  endpoint.replace(/^\/+/, "");

/**
 * Build a domain-scoped v3 API path behind the fixed `/api/pulp` proxy marker.
 * A leading slash on `endpoint` is optional — `"repositories/"` and
 * `"/repositories/"` both yield `/api/pulp[/default]/api/v3/repositories/`. The
 * trailing slash is preserved as-is (Pulp URLs are trailing-slash-significant).
 */
export const pulpApiPath = (endpoint: string, domain: IPulpDomain): string =>
  `/api/pulp${domainSegment(domain)}/api/v3/${stripLeadingSlash(endpoint)}`;

/**
 * Normalize any pulp_href to the fixed `/api/pulp` proxy marker so it is routed
 * through the dev/prod proxy and rewritten to the backend's real `API_ROOT`.
 *
 * Handles both href sources idempotently:
 * - Built hrefs (already `/api/pulp/...`) pass through unchanged.
 * - Raw hrefs from API responses (`{API_ROOT}/...`, e.g. `/pulp/default/...`)
 *   get their real `API_ROOT` prefix swapped for `/api/pulp`.
 */
export const toProxyHref = (href: string): string => {
  if (href.startsWith("/api/pulp")) return href;
  const root = normalizePulpApiRoot(ENV.PULP_API_ROOT ?? "");
  if (href === root || href.startsWith(`${root}/`)) {
    return `/api/pulp${href.slice(root.length)}`;
  }
  return `/api/pulp${href.startsWith("/") ? "" : "/"}${href}`;
};
