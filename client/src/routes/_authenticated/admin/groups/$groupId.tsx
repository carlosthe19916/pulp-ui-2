import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { GroupDetailRoute } from "@app/pages/admin/groups/group-details/GroupDetailRoute";
import { groupDetailQueryOptions } from "@app/queries/groups";
import { ensureDefaultDomain } from "@app/queries/utils/loaderDomain";
import { buildGroupHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute("/_authenticated/admin/groups/$groupId")({
  loader: async ({ context: { queryClient }, params: { groupId } }) => {
    const domain = await ensureDefaultDomain(queryClient);
    const href = buildGroupHref(groupId, domain);
    await queryClient.ensureQueryData(groupDetailQueryOptions({ href }));
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading group" />,
  errorComponent: DetailRouteError,
  component: GroupDetailRoute,
});
