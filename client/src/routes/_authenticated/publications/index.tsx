import { createFileRoute } from "@tanstack/react-router";

import { PublicationList } from "@app/pages/resources/PublicationList";

export const Route = createFileRoute("/_authenticated/publications/")({
  component: PublicationList,
});
