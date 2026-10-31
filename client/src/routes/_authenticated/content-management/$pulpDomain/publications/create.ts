import { createFileRoute } from "@tanstack/react-router";

import { PublicationCreate } from "@app/pages/content-management/publications/publication-create/PublicationCreate";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/publications/create",
)({
  validateSearch: (search: Record<string, unknown>): { type?: string } => ({
    type: typeof search.type === "string" ? search.type : undefined,
  }),
  component: PublicationCreate,
});
