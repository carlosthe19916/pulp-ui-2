import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@app/pages/resources/ComingSoon";

export const Route = createFileRoute("/_authenticated/admin/signing-services/")(
  {
    component: () => <ComingSoon title="Signing Services" />,
  },
);
