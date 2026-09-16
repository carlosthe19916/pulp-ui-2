import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { RepositoryDetailRoute } from "@app/pages/content-management/repositories/repository-details/RepositoryDetailRoute";
import { fileRepositoryDetailQueryOptions } from "@app/queries/file-repositories";
import { ensureApiDomain } from "@app/queries/utils/loaderDomain";
import { buildRepositoryHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute(
  "/_authenticated/content-management/repositories/$repoId",
)({
  loader: async ({ context: { queryClient }, params: { repoId } }) => {
    const domain = await ensureApiDomain(queryClient);
    await queryClient.ensureQueryData(
      fileRepositoryDetailQueryOptions(buildRepositoryHref(repoId, domain)),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading repository" />,
  errorComponent: DetailRouteError,
  component: RepositoryDetailRoute,
});
