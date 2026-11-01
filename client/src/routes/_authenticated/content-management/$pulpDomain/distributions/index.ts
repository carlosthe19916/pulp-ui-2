import { createFileRoute } from "@tanstack/react-router";

import { DistributionList } from "@app/pages/content-management/distributions/distribution-list/DistributionList";
import { DISTRIBUTION_LIST_STATE } from "@app/pages/content-management/distributions/distribution-list/distributionListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(DISTRIBUTION_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/distributions/",
)({
  validateSearch,
  search,
  component: DistributionList,
});
