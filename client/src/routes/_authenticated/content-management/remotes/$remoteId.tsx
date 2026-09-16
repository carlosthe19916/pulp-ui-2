import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { RemoteDetailRoute } from "@app/pages/content-management/remotes/remote-details/RemoteDetailRoute";
import { fileRemoteDetailQueryOptions } from "@app/queries/file-remotes";
import { ensureApiDomain } from "@app/queries/utils/loaderDomain";
import { buildRemoteHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute(
  "/_authenticated/content-management/remotes/$remoteId",
)({
  loader: async ({ context: { queryClient }, params: { remoteId } }) => {
    const domain = await ensureApiDomain(queryClient);
    await queryClient.ensureQueryData(
      fileRemoteDetailQueryOptions(buildRemoteHref(remoteId, domain)),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading remote" />,
  errorComponent: DetailRouteError,
  component: RemoteDetailRoute,
});
