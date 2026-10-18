import { useParams } from "@tanstack/react-router";

import { DEFAULT_PULP_DOMAIN } from "@app/Constants";
import { useApiStatus } from "@app/hooks/useApiStatus";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";

/**
 * Selected content domain for the current page. `enabled` comes from `/status`;
 * `name` is the `$pulpDomain` path param (the URL is the source of truth — no
 * storage). Outside a content route (no param) or when domains are disabled it
 * falls back to the default domain.
 */
export const useSelectedDomain = (): IPulpDomain => {
  const apiStatus = useApiStatus();
  const { pulpDomain } = useParams({ strict: false });
  const enabled = apiStatus.status?.domain_enabled ?? false;
  return {
    enabled,
    name: enabled ? (pulpDomain ?? DEFAULT_PULP_DOMAIN) : DEFAULT_PULP_DOMAIN,
  };
};

export default useSelectedDomain;
