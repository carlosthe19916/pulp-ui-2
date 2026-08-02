import { createFileRoute } from "@tanstack/react-router";

import { DistributionList } from "@app/pages/resources/DistributionList";

export const Route = createFileRoute("/_authenticated/distributions/")({
  component: DistributionList,
});
