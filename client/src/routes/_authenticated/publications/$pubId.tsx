import { createFileRoute } from "@tanstack/react-router";

import { PublicationDetailRoute } from "@app/pages/resources/PublicationDetailRoute";

export const Route = createFileRoute("/_authenticated/publications/$pubId")({
  component: PublicationDetailRoute,
});
