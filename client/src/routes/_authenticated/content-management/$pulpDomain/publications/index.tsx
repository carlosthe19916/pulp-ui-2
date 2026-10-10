import { createFileRoute } from "@tanstack/react-router";

import { PublicationList } from "@app/pages/content-management/publications/publication-list/PublicationList";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/publications/",
)({
  component: PublicationList,
});
