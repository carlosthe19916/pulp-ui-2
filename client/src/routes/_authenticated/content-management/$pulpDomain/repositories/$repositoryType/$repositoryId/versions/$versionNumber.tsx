import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { RepositoryVersionDetailRoute } from "@app/pages/content-management/repositories/repository-version-detail/RepositoryVersionDetailRoute";
import {
  buildRepositoryVersionHref,
  repositoryVersionDetailQueryOptions,
} from "@app/queries/repositories";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, repositoryType, repositoryId, versionNumber },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const versionHref = buildRepositoryVersionHref(
      repositoryType,
      repositoryId,
      versionNumber,
      domain,
    );
    if (!versionHref) throw new Error("Unknown repository plugin type");
    await queryClient.ensureQueryData(
      repositoryVersionDetailQueryOptions({ versionHref }),
    );
  },
  pendingComponent: () => (
    <DetailRoutePending label="Loading repository version" />
  ),
  errorComponent: DetailRouteError,
  component: RepositoryVersionDetailRoute,
});
