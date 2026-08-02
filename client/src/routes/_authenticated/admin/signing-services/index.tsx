import { createFileRoute } from "@tanstack/react-router";

import { SigningServiceList } from "@app/pages/platform/admin/signing-services/SigningServiceList";

export const Route = createFileRoute("/_authenticated/admin/signing-services/")(
  {
    component: SigningServiceList,
  },
);
