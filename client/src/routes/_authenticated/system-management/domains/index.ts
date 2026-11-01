import { createFileRoute } from "@tanstack/react-router";

import { DOMAIN_LIST_STATE } from "@app/pages/system-management/domains/domainListState";
import { DomainsGuard } from "@app/pages/system-management/domains/DomainsGuard";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(DOMAIN_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/system-management/domains/",
)({
  validateSearch,
  search,
  component: DomainsGuard,
});
