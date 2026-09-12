import { createFileRoute } from "@tanstack/react-router";

import { DistributionList } from "@app/pages/content-management/distributions/DistributionList";

export const Route = createFileRoute(
  "/_authenticated/content-management/distributions/",
)({
  component: DistributionList,
});
