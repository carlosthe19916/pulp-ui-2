import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { RepositoryDetailRoute } from "@app/pages/content-management/repositories/repository-detail/RepositoryDetailRoute";
import {
  buildRepositoryHref,
  repositoryDetailQueryOptions,
} from "@app/queries/repositories";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, repositoryType, repositoryId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildRepositoryHref(repositoryType, repositoryId, domain);
    if (!href) throw new Error("Unknown repository plugin type");
    await queryClient.query({
      ...repositoryDetailQueryOptions({ href }),
      staleTime: "static",
    });
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading repository" />,
  errorComponent: DetailRouteError,
  component: RepositoryDetailRoute,
});
