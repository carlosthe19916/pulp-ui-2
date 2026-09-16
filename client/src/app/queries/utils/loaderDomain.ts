import type { QueryClient } from "@tanstack/react-query";

import { statusQueryOptions } from "@app/queries/status";
import { apiDomainFromStatus } from "@app/queries/utils/pulpApi";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";

/**
 * Resolve the API domain inside a router loader. Loaders run outside React so
 * can't use `useApiDomain`; the domain derives from the cached `/status` query,
 * which we prime/read via `ensureQueryData`.
 */
export const ensureApiDomain = async (
  queryClient: QueryClient,
): Promise<IPulpDomain> =>
  apiDomainFromStatus(await queryClient.ensureQueryData(statusQueryOptions));
