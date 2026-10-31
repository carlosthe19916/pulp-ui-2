import type { QueryClient } from "@tanstack/react-query";

import { myPermissionsQueryOptions } from "@app/queries/access";
import { isSuperuserQueryOptions } from "@app/queries/users";
import { ensureDefaultDomain } from "@app/queries/utils/loaderDomain";

/**
 * Loads what an edit page's permission check reads (`useObjectPermissions`), so the page
 * doesn't flash the form before showing it's not allowed. Failures are swallowed: when the
 * permissions can't be read nothing is blocked and the server still enforces (ADR 0008).
 */
export const prefetchEditPermissions = async ({
  queryClient,
  href,
}: {
  queryClient: QueryClient;
  href: string;
}): Promise<void> => {
  const domain = await ensureDefaultDomain(queryClient);
  await Promise.all([
    queryClient.query(myPermissionsQueryOptions({ href })).catch(() => null),
    queryClient.query(isSuperuserQueryOptions({ domain })).catch(() => null),
  ]);
};
