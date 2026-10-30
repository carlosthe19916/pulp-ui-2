import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { getEntityForm } from "@app/forms";
import { RemoteEditRoute } from "@app/pages/content-management/remotes/remote-edit/RemoteEditRoute";
import {
  buildRemoteHref,
  remoteDetailQueryOptions,
} from "@app/queries/remotes";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";
import { prefetchEditPermissions } from "@app/queries/utils/loaderPermissions";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/remotes/$remoteType/$remoteId/edit",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, remoteType, remoteId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildRemoteHref(remoteType, remoteId, domain);
    if (!href) throw new Error("Unknown remote plugin type");
    if (
      !getEntityForm({ entity: "remote", pulpType: remoteType, mode: "edit" })
    ) {
      throw new Error("This remote type can't be edited");
    }
    await queryClient.query({
      ...remoteDetailQueryOptions({ href }),
      staleTime: "static",
    });
    await prefetchEditPermissions({ queryClient, href });
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading remote" />,
  errorComponent: DetailRouteError,
  component: RemoteEditRoute,
});
