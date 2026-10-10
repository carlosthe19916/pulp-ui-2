import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { REPOSITORY_FAMILY } from "@app/queries/utils/families";
import { RepositoryDetailRoute } from "@app/pages/content-management/repositories/repository-details/RepositoryDetailRoute";
import {
  entityDetailQueryOptions,
  entityHrefByIdQueryOptions,
} from "@app/queries/utils/entityCrud";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/repositories/$repoId",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, repoId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = await queryClient.ensureQueryData(
      entityHrefByIdQueryOptions(
        REPOSITORY_FAMILY.rootQueryKey,
        "repositories",
        repoId,
        domain,
      ),
    );
    if (!href) {
      throw new Error(`Repository "${repoId}" not found`);
    }
    await queryClient.ensureQueryData(
      entityDetailQueryOptions(REPOSITORY_FAMILY.rootQueryKey, href),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading repository" />,
  errorComponent: DetailRouteError,
  component: RepositoryDetailRoute,
});
