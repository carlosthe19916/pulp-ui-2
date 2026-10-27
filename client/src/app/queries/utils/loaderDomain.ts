import type { QueryClient } from "@tanstack/react-query";

import { DEFAULT_PULP_DOMAIN } from "@app/constants";
import { statusQueryOptions } from "@app/queries/status";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";
import { defaultDomainFromStatus } from "@app/queries/utils/pulpApi";

/**
 * Resolve the default domain in a router loader (outside React, so no `useDefaultDomain`)
 * from the cached `/status` query.
 */
export const ensureDefaultDomain = async (
  queryClient: QueryClient,
): Promise<IPulpDomain> =>
  defaultDomainFromStatus(
    await queryClient.query({ ...statusQueryOptions, staleTime: "static" }),
  );

/**
 * Loader equivalent of `useSelectedDomain`: `enabled` from `/status`, `name` from the
 * route's `$pulpDomain` param.
 */
export const ensureDomainFromParam = async (
  queryClient: QueryClient,
  pulpDomain: string,
): Promise<IPulpDomain> => {
  const status = await queryClient.query({
    ...statusQueryOptions,
    staleTime: "static",
  });
  const enabled = status?.domain_enabled ?? false;
  return {
    enabled,
    name: enabled ? pulpDomain : DEFAULT_PULP_DOMAIN,
  };
};
