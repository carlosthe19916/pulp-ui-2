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
  const isSuperuser = await queryClient
    .query(isSuperuserQueryOptions({ domain }))
    .catch(() => null);
  // `useObjectPermissions` skips `my_permissions/` only for a known superuser. This runs
  // after the superuser check (usually cached for the session) to skip that useless read.
  if (isSuperuser !== true) {
    await queryClient
      .query(myPermissionsQueryOptions({ href }))
      .catch(() => null);
  }
};
