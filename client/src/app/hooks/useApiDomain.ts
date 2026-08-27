import { use } from "react";

import { DEFAULT_PULP_DOMAIN } from "@app/Constants";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import type { PulpDomain } from "@app/queries/utils/pulpApi";

/**
 * Read the live domain config from API status.
 *
 * pulpcore only inserts a domain segment into API paths when `DOMAIN_ENABLED`
 * is true; `domain_enabled` comes from the `/status` endpoint. Safe to read
 * synchronously because `WaitForApiStatus` (RootLayout) gates rendering until
 * status has loaded.
 */
export const useApiDomain = (): PulpDomain => {
  const apiStatus = use(ApiStatusContext);
  return {
    enabled: apiStatus?.status?.domain_enabled ?? false,
    name: DEFAULT_PULP_DOMAIN,
  };
};

export default useApiDomain;
