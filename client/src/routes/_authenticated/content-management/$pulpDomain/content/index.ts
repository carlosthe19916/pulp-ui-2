import { createFileRoute } from "@tanstack/react-router";

import { ContentList } from "@app/pages/content-management/content/content-list/ContentList";
import { CONTENT_LIST_STATE } from "@app/pages/content-management/content/content-list/contentListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(CONTENT_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/content/",
)({
  validateSearch,
  search,
  component: ContentList,
});
