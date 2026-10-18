import { useApiStatus } from "@app/hooks/useApiStatus";
import { defaultDomainFromStatus } from "@app/queries/utils/pulpApi";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";

/**
 * The default Pulp domain ("default") plus whether domains are enabled (from
 * `/status`). Use for resources not scoped to a browsed content domain — the
 * global/admin ones (users, groups, roles, domains, signing services, tasks).
 * Note: `/status` only reports `domain_enabled`; the name is the fixed Pulp
 * default, not returned by the API. Safe to read synchronously because
 * `WaitForApiStatus` (RootLayout) gates rendering until status has loaded.
 */
export const useDefaultDomain = (): IPulpDomain => {
  const apiStatus = useApiStatus();
  return defaultDomainFromStatus(apiStatus.status);
};

export default useDefaultDomain;
