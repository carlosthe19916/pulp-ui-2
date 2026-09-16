import { use } from "react";

import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import { apiDomainFromStatus } from "@app/queries/utils/pulpApi";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";

/**
 * Live domain config from API `/status`. Safe to read synchronously because
 * `WaitForApiStatus` (RootLayout) gates rendering until status has loaded.
 */
export const useApiDomain = (): IPulpDomain => {
  const apiStatus = use(ApiStatusContext);
  return apiDomainFromStatus(apiStatus?.status);
};

export default useApiDomain;
