import { createFileRoute } from "@tanstack/react-router";

import { RepositoryDetailRoute } from "@app/pages/resources/RepositoryDetailRoute";

export const Route = createFileRoute("/_authenticated/repositories/$repoId")({
  component: RepositoryDetailRoute,
});
