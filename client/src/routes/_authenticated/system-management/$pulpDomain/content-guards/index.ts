import { createFileRoute } from "@tanstack/react-router";

import { ContentGuardList } from "@app/pages/system-management/content-guards/content-guard-list/ContentGuardList";
import { CONTENT_GUARD_LIST_STATE } from "@app/pages/system-management/content-guards/content-guard-list/contentGuardListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(CONTENT_GUARD_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/system-management/$pulpDomain/content-guards/",
)({
  validateSearch,
  search,
  component: ContentGuardList,
});
