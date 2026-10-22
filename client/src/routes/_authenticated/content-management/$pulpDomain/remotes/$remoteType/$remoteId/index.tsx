import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { RemoteDetailRoute } from "@app/pages/content-management/remotes/remote-detail/RemoteDetailRoute";
import {
  buildRemoteHref,
  remoteDetailQueryOptions,
} from "@app/queries/remotes";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/remotes/$remoteType/$remoteId/",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, remoteType, remoteId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildRemoteHref(remoteType, remoteId, domain);
    if (!href) throw new Error("Unknown remote plugin type");
    await queryClient.ensureQueryData(remoteDetailQueryOptions({ href }));
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading remote" />,
  errorComponent: DetailRouteError,
  component: RemoteDetailRoute,
});
