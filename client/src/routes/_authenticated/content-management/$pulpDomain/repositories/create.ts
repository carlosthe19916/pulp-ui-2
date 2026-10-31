import { createFileRoute } from "@tanstack/react-router";

import { RepositoryCreate } from "@app/pages/content-management/repositories/repository-create/RepositoryCreate";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/repositories/create",
)({
  validateSearch: (search: Record<string, unknown>): { type?: string } => ({
    type: typeof search.type === "string" ? search.type : undefined,
  }),
  component: RepositoryCreate,
});
