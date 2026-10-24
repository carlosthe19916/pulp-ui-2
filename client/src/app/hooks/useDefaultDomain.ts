import { useApiStatus } from "@app/hooks/useApiStatus";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";
import { defaultDomainFromStatus } from "@app/queries/utils/pulpApi";

/**
 * The default Pulp domain plus whether domains are enabled, for global/admin resources
 * not scoped to a browsed content domain.
 */
export const useDefaultDomain = (): IPulpDomain => {
  // `/status` reports only `domain_enabled`; the name is Pulp's fixed default. Safe
  // to read synchronously: `WaitForApiStatus` gates rendering until status loads.
  const apiStatus = useApiStatus();
  return defaultDomainFromStatus(apiStatus.status);
};
