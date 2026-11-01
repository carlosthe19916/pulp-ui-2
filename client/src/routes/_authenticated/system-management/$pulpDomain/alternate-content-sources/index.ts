import { createFileRoute } from "@tanstack/react-router";

import { AcsList } from "@app/pages/system-management/alternate-content-sources/acs-list/AcsList";
import { ACS_LIST_STATE } from "@app/pages/system-management/alternate-content-sources/acs-list/acsListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(ACS_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/system-management/$pulpDomain/alternate-content-sources/",
)({
  validateSearch,
  search,
  component: AcsList,
});
