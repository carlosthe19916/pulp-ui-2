import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { ContentBrowserRoute } from "@app/pages/browse/ContentBrowserRoute";
import { distributionsRootQueryOptions } from "@app/queries/distributions";
import { entityDetailQueryOptions } from "@app/queries/utils/entityCrud";
import { ensureApiDomain } from "@app/queries/utils/loaderDomain";
import { buildDistributionHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute("/browse/$distributionId/")({
  loader: async ({ context: { queryClient }, params: { distributionId } }) => {
    const domain = await ensureApiDomain(queryClient);
    await queryClient.ensureQueryData(
      entityDetailQueryOptions(
        distributionsRootQueryOptions.queryKey,
        buildDistributionHref(distributionId, domain),
      ),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading distribution" />,
  errorComponent: DetailRouteError,
  component: ContentBrowserRoute,
});
