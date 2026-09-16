import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { RoleDetailRoute } from "@app/pages/admin/roles/role-details/RoleDetailRoute";
import { roleDetailQueryOptions } from "@app/queries/roles";
import { ensureApiDomain } from "@app/queries/utils/loaderDomain";
import { buildRoleHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute("/_authenticated/admin/roles/$roleId")({
  loader: async ({ context: { queryClient }, params: { roleId } }) => {
    const domain = await ensureApiDomain(queryClient);
    await queryClient.ensureQueryData(
      roleDetailQueryOptions(buildRoleHref(roleId, domain)),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading role" />,
  errorComponent: DetailRouteError,
  component: RoleDetailRoute,
});
