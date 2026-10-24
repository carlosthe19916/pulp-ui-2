import { useParams } from "@tanstack/react-router";

import { DEFAULT_PULP_DOMAIN } from "@app/constants";
import { useApiStatus } from "@app/hooks/useApiStatus";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";

/**
 * The selected content domain: `enabled` from `/status`, `name` from the `$pulpDomain`
 * path param, else the default domain.
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
