import { createFileRoute } from "@tanstack/react-router";

import { DetailRouteError } from "@app/components/DetailRouteError";
import { DetailRoutePending } from "@app/components/DetailRoutePending";
import { PUBLICATION_FAMILY } from "@app/queries/utils/families";
import { PublicationDetailRoute } from "@app/pages/content-management/publications/publication-details/PublicationDetailRoute";
import {
  entityDetailQueryOptions,
  entityHrefByIdQueryOptions,
} from "@app/queries/utils/entityCrud";
import { ensureDomainFromParam } from "@app/queries/utils/loaderDomain";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/publications/$pubId",
)({
  loader: async ({
    context: { queryClient },
    params: { pulpDomain, pubId },
  }) => {
    const domain = await ensureDomainFromParam(queryClient, pulpDomain);
    const href = await queryClient.ensureQueryData(
      entityHrefByIdQueryOptions(
        PUBLICATION_FAMILY.rootQueryKey,
        "publications",
        pubId,
        domain,
      ),
    );
    if (!href) {
      throw new Error(`Publication "${pubId}" not found`);
    }
    await queryClient.ensureQueryData(
      entityDetailQueryOptions(PUBLICATION_FAMILY.rootQueryKey, href),
    );
  },
  pendingComponent: () => <DetailRoutePending label="Loading publication" />,
  errorComponent: DetailRouteError,
  component: PublicationDetailRoute,
});
