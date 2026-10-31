import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { RepositoryEditRoute } from "@app/pages/content-management/repositories/repository-edit/RepositoryEditRoute";
import {
  buildRepositoryHref,
  repositoryDetailQueryOptions,
} from "@app/queries/repositories";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";
import { prefetchEditPermissions } from "@app/queries/utils/loaderPermissions";
import { getEntityForm } from "@plugins";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/edit",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, repositoryType, repositoryId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildRepositoryHref(repositoryType, repositoryId, domain);
    if (!href) throw new Error("Unknown repository plugin type");
    if (
      !getEntityForm({
        entity: "repository",
        pulpType: repositoryType,
        mode: "edit",
      })
    ) {
      throw new Error("This repository type can't be edited");
    }
    await queryClient.query({
      ...repositoryDetailQueryOptions({ href }),
      // The form diffs against what it loads: never start it from a stale cache.
      staleTime: 0,
    });
    await prefetchEditPermissions({ queryClient, href });
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading repository" />,
  errorComponent: DetailRouteError,
  component: RepositoryEditRoute,
});
