import { createFileRoute } from "@tanstack/react-router";

import { SigningServiceList } from "@app/pages/system-management/signing-services/SigningServiceList";

export const Route = createFileRoute(
  "/_authenticated/system-management/signing-services/",
)({
  component: SigningServiceList,
});
