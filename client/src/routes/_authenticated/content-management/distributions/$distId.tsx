import { createFileRoute } from "@tanstack/react-router";

import { DistributionDetailRoute } from "@app/pages/content-management/distributions/distribution-details/DistributionDetailRoute";

export const Route = createFileRoute(
  "/_authenticated/content-management/distributions/$distId",
)({
  component: DistributionDetailRoute,
});
