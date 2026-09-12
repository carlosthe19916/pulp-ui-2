import { createFileRoute } from "@tanstack/react-router";

import { RepositoryList } from "@app/pages/content-management/repositories/RepositoryList";

export const Route = createFileRoute(
  "/_authenticated/content-management/repositories/",
)({
  component: RepositoryList,
});
