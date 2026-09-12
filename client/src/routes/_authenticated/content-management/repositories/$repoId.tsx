import { createFileRoute } from "@tanstack/react-router";

import { RepositoryDetailRoute } from "@app/pages/content-management/repositories/RepositoryDetailRoute";

export const Route = createFileRoute(
  "/_authenticated/content-management/repositories/$repoId",
)({
  component: RepositoryDetailRoute,
});
