import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { UserDetailRoute } from "@app/pages/admin/users/user-details/UserDetailRoute";
import { userDetailQueryOptions } from "@app/queries/users";
import { ensureDefaultDomain } from "@app/queries/utils/loaderDomain";
import { buildUserHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute("/_authenticated/admin/users/$userId")({
  loader: async ({ context: { queryClient }, params: { userId } }) => {
    const domain = await ensureDefaultDomain(queryClient);
    const href = buildUserHref(userId, domain);
    await queryClient.ensureQueryData(userDetailQueryOptions({ href }));
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading user" />,
  errorComponent: DetailRouteError,
  component: UserDetailRoute,
});
