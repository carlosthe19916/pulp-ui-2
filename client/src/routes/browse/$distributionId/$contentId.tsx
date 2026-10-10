import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { BrowseContentDetailRoute } from "@app/pages/browse/BrowseContentDetailRoute";
import { contentRootQueryOptions } from "@app/queries/content";
import { entityDetailQueryOptions } from "@app/queries/utils/entityCrud";
import { ensureApiDomain } from "@app/queries/utils/loaderDomain";
import { buildContentHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute("/browse/$distributionId/$contentId")({
  loader: async ({ context: { queryClient }, params: { contentId } }) => {
    const domain = await ensureApiDomain(queryClient);
    await queryClient.ensureQueryData(
      entityDetailQueryOptions(
        contentRootQueryOptions.queryKey,
        buildContentHref(contentId, domain),
      ),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading content" />,
  errorComponent: DetailRouteError,
  component: BrowseContentDetailRoute,
});
