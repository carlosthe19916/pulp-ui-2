import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { REMOTE_FAMILY } from "@app/queries/utils/families";
import { RemoteDetailRoute } from "@app/pages/content-management/remotes/remote-details/RemoteDetailRoute";
import {
  entityDetailQueryOptions,
  entityHrefByIdQueryOptions,
} from "@app/queries/utils/entityCrud";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/remotes/$remoteId",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, remoteId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = await queryClient.ensureQueryData(
      entityHrefByIdQueryOptions(
        REMOTE_FAMILY.rootQueryKey,
        "remotes",
        remoteId,
        domain,
      ),
    );
    if (!href) {
      throw new Error(`Remote "${remoteId}" not found`);
    }
    await queryClient.ensureQueryData(
      entityDetailQueryOptions(REMOTE_FAMILY.rootQueryKey, href),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading remote" />,
  errorComponent: DetailRouteError,
  component: RemoteDetailRoute,
});
