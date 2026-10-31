import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { DistributionDetailRoute } from "@app/pages/content-management/distributions/distribution-detail/DistributionDetailRoute";
import {
  buildDistributionHref,
  distributionDetailQueryOptions,
} from "@app/queries/distributions";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/distributions/$distributionType/$distributionId/",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, distributionType, distributionId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildDistributionHref(
      distributionType,
      distributionId,
      domain,
    );
    if (!href) throw new Error("Unknown distribution plugin type");
    await queryClient.query({
      ...distributionDetailQueryOptions({ href }),
      staleTime: "static",
    });
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading distribution" />,
  errorComponent: DetailRouteError,
  component: DistributionDetailRoute,
});
