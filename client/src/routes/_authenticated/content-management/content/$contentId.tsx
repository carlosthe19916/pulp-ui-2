import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { ContentDetailRoute } from "@app/pages/content-management/content/content-details/ContentDetailRoute";
import { fileContentDetailQueryOptions } from "@app/queries/file-content";
import { ensureApiDomain } from "@app/queries/utils/loaderDomain";
import { buildContentHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute(
  "/_authenticated/content-management/content/$contentId",
)({
  loader: async ({ context: { queryClient }, params: { contentId } }) => {
    const domain = await ensureApiDomain(queryClient);
    await queryClient.ensureQueryData(
      fileContentDetailQueryOptions(buildContentHref(contentId, domain)),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading content" />,
  errorComponent: DetailRouteError,
  component: ContentDetailRoute,
});
