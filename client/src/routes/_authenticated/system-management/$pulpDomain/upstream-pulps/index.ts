import { createFileRoute } from "@tanstack/react-router";

import { UpstreamPulpList } from "@app/pages/system-management/upstream-pulps/upstream-pulp-list/UpstreamPulpList";

export const Route = createFileRoute(
  "/_authenticated/system-management/$pulpDomain/upstream-pulps/",
)({
  component: UpstreamPulpList,
});
