import { createFileRoute } from "@tanstack/react-router";

import { RepositoryList } from "@app/pages/content-management/repositories/repository-list/RepositoryList";
import { REPOSITORY_LIST_STATE } from "@app/pages/content-management/repositories/repository-list/repositoryListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(REPOSITORY_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/repositories/",
)({
  validateSearch,
  search,
  component: RepositoryList,
});
