import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { ContentDetailRoute } from "@app/pages/content-management/content/content-detail/ContentDetailRoute";
import {
  buildContentHref,
  contentDetailQueryOptions,
} from "@app/queries/content";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/content/$contentType/$contentId/",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, contentType, contentId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildContentHref(contentType, contentId, domain);
    if (!href) throw new Error("Unknown content plugin type");
    await queryClient.ensureQueryData(contentDetailQueryOptions({ href }));
  },
  pendingComponent: () => <DetailRoutePending label="Loading content" />,
  errorComponent: DetailRouteError,
  component: ContentDetailRoute,
});
