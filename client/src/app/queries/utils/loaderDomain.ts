import type { QueryClient } from "@tanstack/react-query";

import { statusQueryOptions } from "@app/queries/status";
import { apiDomainFromStatus } from "@app/queries/utils/pulpApi";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";

/**
 * Resolve the API domain config inside a router loader.
 *
 * Loaders run outside React and cannot call `useApiDomain`, but the domain
 * derives from the `/status` query — the same cache entry `ApiStatusProvider`
 * fills — so we prime/read it via `ensureQueryData` and reuse the pure
 * `apiDomainFromStatus` helper.
 */
export const ensureApiDomain = async (
  queryClient: QueryClient,
): Promise<IPulpDomain> =>
  apiDomainFromStatus(await queryClient.ensureQueryData(statusQueryOptions));
