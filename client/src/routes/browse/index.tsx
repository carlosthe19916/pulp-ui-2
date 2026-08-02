import { createFileRoute } from "@tanstack/react-router";

import { DistributionBrowser } from "@app/pages/browse/DistributionBrowser";

export const Route = createFileRoute("/browse/")({
  component: DistributionBrowser,
});
