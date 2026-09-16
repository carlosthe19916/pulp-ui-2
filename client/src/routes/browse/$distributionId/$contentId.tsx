import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { BrowseContentDetailRoute } from "@app/pages/browse/BrowseContentDetailRoute";
import { fileContentDetailQueryOptions } from "@app/queries/file-content";
import { ensureApiDomain } from "@app/queries/utils/loaderDomain";
import { buildContentHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute("/browse/$distributionId/$contentId")({
  loader: async ({ context: { queryClient }, params: { contentId } }) => {
    const domain = await ensureApiDomain(queryClient);
    await queryClient.ensureQueryData(
      fileContentDetailQueryOptions(buildContentHref(contentId, domain)),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading content" />,
  errorComponent: DetailRouteError,
  component: BrowseContentDetailRoute,
});
