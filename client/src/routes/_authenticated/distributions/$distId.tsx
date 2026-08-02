import { createFileRoute } from "@tanstack/react-router";

import { DistributionDetailRoute } from "@app/pages/resources/DistributionDetailRoute";

export const Route = createFileRoute("/_authenticated/distributions/$distId")({
  component: DistributionDetailRoute,
});
