import { createFileRoute } from "@tanstack/react-router";

import { PublicationList } from "@app/pages/content-management/publications/publication-list/PublicationList";
import { PUBLICATION_LIST_STATE } from "@app/pages/content-management/publications/publication-list/publicationListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(PUBLICATION_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/publications/",
)({
  validateSearch,
  search,
  component: PublicationList,
});
