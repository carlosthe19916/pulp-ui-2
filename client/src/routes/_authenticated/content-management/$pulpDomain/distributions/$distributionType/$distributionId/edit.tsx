import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { DistributionEditRoute } from "@app/pages/content-management/distributions/distribution-edit/DistributionEditRoute";
import {
  buildDistributionHref,
  distributionDetailQueryOptions,
} from "@app/queries/distributions";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";
import { prefetchEditPermissions } from "@app/queries/utils/loaderPermissions";
import { getEntityForm } from "@plugins";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/distributions/$distributionType/$distributionId/edit",
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
    if (
      !getEntityForm({
        entity: "distribution",
        pulpType: distributionType,
        mode: "edit",
      })
    ) {
      throw new Error("This distribution type can't be edited");
    }
    await queryClient.query({
      ...distributionDetailQueryOptions({ href }),
      // The form diffs against what it loads: never start it from a stale cache.
      staleTime: 0,
    });
    await prefetchEditPermissions({ queryClient, href });
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading distribution" />,
  errorComponent: DetailRouteError,
  component: DistributionEditRoute,
});
