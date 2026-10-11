import { createFileRoute } from "@tanstack/react-router";

import { RepositoryListPage } from "@app/pages/content-management/repositories/repository-list/RepositoryListPage";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/repositories/",
)({
  component: RepositoryListPage,
});
