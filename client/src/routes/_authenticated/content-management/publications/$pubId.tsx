import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { PublicationDetailRoute } from "@app/pages/content-management/publications/publication-details/PublicationDetailRoute";
import { filePublicationDetailQueryOptions } from "@app/queries/file-publications";
import { ensureApiDomain } from "@app/queries/utils/loaderDomain";
import { buildPublicationHref } from "@app/queries/utils/pulpHref";

export const Route = createFileRoute(
  "/_authenticated/content-management/publications/$pubId",
)({
  loader: async ({ context: { queryClient }, params: { pubId } }) => {
    const domain = await ensureApiDomain(queryClient);
    await queryClient.ensureQueryData(
      filePublicationDetailQueryOptions(buildPublicationHref(pubId, domain)),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading publication" />,
  errorComponent: DetailRouteError,
  component: PublicationDetailRoute,
});
