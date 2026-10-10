import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { DISTRIBUTION_FAMILY } from "@app/queries/utils/families";
import { DistributionDetailRoute } from "@app/pages/content-management/distributions/distribution-details/DistributionDetailRoute";
import {
  entityDetailQueryOptions,
  entityHrefByIdQueryOptions,
} from "@app/queries/utils/entityCrud";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/distributions/$distId",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, distId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = await queryClient.ensureQueryData(
      entityHrefByIdQueryOptions(
        DISTRIBUTION_FAMILY.rootQueryKey,
        "distributions",
        distId,
        domain,
      ),
    );
    if (!href) {
      throw new Error(`Distribution "${distId}" not found`);
    }
    await queryClient.ensureQueryData(
      entityDetailQueryOptions(DISTRIBUTION_FAMILY.rootQueryKey, href),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading distribution" />,
  errorComponent: DetailRouteError,
  component: DistributionDetailRoute,
});
