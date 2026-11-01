import { createFileRoute } from "@tanstack/react-router";

import { UpstreamPulpList } from "@app/pages/system-management/upstream-pulps/upstream-pulp-list/UpstreamPulpList";
import { UPSTREAM_PULP_LIST_STATE } from "@app/pages/system-management/upstream-pulps/upstream-pulp-list/upstreamPulpListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(UPSTREAM_PULP_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/system-management/$pulpDomain/upstream-pulps/",
)({
  validateSearch,
  search,
  component: UpstreamPulpList,
});
