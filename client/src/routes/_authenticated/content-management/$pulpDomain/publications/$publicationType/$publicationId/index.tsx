import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { PublicationDetailRoute } from "@app/pages/content-management/publications/publication-detail/PublicationDetailRoute";
import {
  buildPublicationHref,
  publicationDetailQueryOptions,
} from "@app/queries/publications";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/publications/$publicationType/$publicationId/",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, publicationType, publicationId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = buildPublicationHref(publicationType, publicationId, domain);
    if (!href) throw new Error("Unknown publication plugin type");
    await queryClient.query({
      ...publicationDetailQueryOptions({ href }),
      staleTime: "static",
    });
    return { href };
  },
  pendingComponent: () => <DetailRoutePending label="Loading publication" />,
  errorComponent: DetailRouteError,
  component: PublicationDetailRoute,
});
