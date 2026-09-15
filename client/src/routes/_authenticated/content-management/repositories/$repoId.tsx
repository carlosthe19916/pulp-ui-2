import { createFileRoute } from "@tanstack/react-router";

import { RepositoryDetailRoute } from "@app/pages/content-management/repositories/repository-details/RepositoryDetailRoute";

export const Route = createFileRoute(
  "/_authenticated/content-management/repositories/$repoId",
)({
  component: RepositoryDetailRoute,
});
