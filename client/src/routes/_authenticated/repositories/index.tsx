import { createFileRoute } from "@tanstack/react-router";

import { RepositoryList } from "@app/pages/resources/RepositoryList";

export const Route = createFileRoute("/_authenticated/repositories/")({
  component: RepositoryList,
});
