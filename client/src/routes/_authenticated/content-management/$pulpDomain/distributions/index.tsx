import { createFileRoute } from "@tanstack/react-router";

import { DistributionListPage } from "@app/pages/content-management/distributions/distribution-list/DistributionListPage";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/distributions/",
)({
  component: DistributionListPage,
});
