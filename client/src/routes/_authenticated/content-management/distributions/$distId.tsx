import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { DistributionDetailRoute } from "@app/pages/content-management/distributions/distribution-details/DistributionDetailRoute";
import { fileDistributionDetailQueryOptions } from "@app/queries/file-distributions";
import { ensureApiDomain } from "@app/queries/utils/loaderDomain";
import { buildDistributionHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute(
  "/_authenticated/content-management/distributions/$distId",
)({
  loader: async ({ context: { queryClient }, params: { distId } }) => {
    const domain = await ensureApiDomain(queryClient);
    await queryClient.ensureQueryData(
      fileDistributionDetailQueryOptions(buildDistributionHref(distId, domain)),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading distribution" />,
  errorComponent: DetailRouteError,
  component: DistributionDetailRoute,
});
