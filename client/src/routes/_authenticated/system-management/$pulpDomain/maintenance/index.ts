import { createFileRoute } from "@tanstack/react-router";

import { Maintenance } from "@app/pages/system-management/maintenance/Maintenance";

export const Route = createFileRoute(
  "/_authenticated/system-management/$pulpDomain/maintenance/",
)({
  component: Maintenance,
});
