import type { QueryClient } from "@tanstack/react-query";

import { DEFAULT_PULP_DOMAIN } from "@app/Constants";
import { statusQueryOptions } from "@app/queries/status";
import { defaultDomainFromStatus } from "@app/queries/utils/pulpApi";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";

/**
 * Resolve the default domain inside a router loader. Loaders run outside React so
 * can't use `useDefaultDomain`; the domain derives from the cached `/status` query,
 * which we prime/read via `ensureQueryData`.
 */
export const ensureDefaultDomain = async (
  queryClient: QueryClient,
): Promise<IPulpDomain> =>
  defaultDomainFromStatus(
    await queryClient.ensureQueryData(statusQueryOptions),
  );

/**
 * Loader equivalent of `useSelectedDomain`: `enabled` from `/status`, `name` from
 * the route's `$pulpDomain` path param (the source of truth for the selected
 * content domain). When domains are disabled the slug is irrelevant.
 */
export const ensureDomainFromParam = async (
  queryClient: QueryClient,
  pulpDomain: string,
): Promise<IPulpDomain> => {
  const status = await queryClient.ensureQueryData(statusQueryOptions);
  const enabled = status?.domain_enabled ?? false;
  return {
    enabled,
    name: enabled ? pulpDomain : DEFAULT_PULP_DOMAIN,
  };
};
