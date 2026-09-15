import { createFileRoute } from "@tanstack/react-router";

import { PublicationList } from "@app/pages/content-management/publications/publication-list/PublicationList";

export const Route = createFileRoute(
  "/_authenticated/content-management/publications/",
)({
  component: PublicationList,
});
