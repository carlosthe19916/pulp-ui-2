import { createFileRoute } from "@tanstack/react-router";

import { AcsList } from "@app/pages/system-management/alternate-content-sources/acs-list/AcsList";

export const Route = createFileRoute(
  "/_authenticated/system-management/$pulpDomain/alternate-content-sources/",
)({
  component: AcsList,
});
