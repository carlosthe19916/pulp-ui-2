import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { ContentDetailRoute } from "@app/pages/content-management/content/content-details/ContentDetailRoute";
import { contentRootQueryOptions } from "@app/queries/content";
import { entityDetailQueryOptions } from "@app/queries/utils/entityCrud";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";
import { buildContentHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/content/$contentId",
)({
  loader: async ({
    context: { queryClient },
    params: { contentId, pulpDomain },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    await queryClient.ensureQueryData(
      entityDetailQueryOptions(
        contentRootQueryOptions.queryKey,
        buildContentHref(contentId, domain),
      ),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading content" />,
  errorComponent: DetailRouteError,
  component: ContentDetailRoute,
});
