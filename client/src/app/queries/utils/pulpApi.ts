import { normalizePulpApiRoot } from "@pulp-ui/common";

import type { StatusResponse } from "@app/client";
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

/**
 * Build a domain-scoped v3 API path behind the `/api/pulp` proxy marker. Keeps a trailing
 * slash (Pulp URLs are trailing-slash-significant).
 */
export const pulpApiPath = (endpoint: string, domain: IPulpDomain): string =>
  `/api/pulp${domainSegment(domain)}/api/v3/${stripLeadingSlash(endpoint)}`;

const apiRoot = (): string => normalizePulpApiRoot(ENV.PULP_API_ROOT ?? "");

/**
 * Build a resource href in the server's form (`{API_ROOT}…`) so it shares the cache slot
 * of the API's `pulp_href`. A key: fetch it via `toProxyHref`.
 */
export const pulpHref = (endpoint: string, domain: IPulpDomain): string =>
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
