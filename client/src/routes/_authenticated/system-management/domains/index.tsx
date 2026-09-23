import { createFileRoute } from "@tanstack/react-router";

import { DomainsGuard } from "@app/pages/system-management/domains/DomainsGuard";

export const Route = createFileRoute(
  "/_authenticated/system-management/domains/",
)({
  component: DomainsGuard,
});
