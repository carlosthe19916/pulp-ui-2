import { createFileRoute } from "@tanstack/react-router";

import { PublicationDetailRoute } from "@app/pages/content-management/publications/publication-details/PublicationDetailRoute";

export const Route = createFileRoute(
  "/_authenticated/content-management/publications/$pubId",
)({
  component: PublicationDetailRoute,
});
