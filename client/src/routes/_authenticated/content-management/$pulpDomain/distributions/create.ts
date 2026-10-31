import { createFileRoute } from "@tanstack/react-router";

import { DistributionCreate } from "@app/pages/content-management/distributions/distribution-create/DistributionCreate";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/distributions/create",
)({
  validateSearch: (search: Record<string, unknown>): { type?: string } => ({
    type: typeof search.type === "string" ? search.type : undefined,
  }),
  component: DistributionCreate,
});
