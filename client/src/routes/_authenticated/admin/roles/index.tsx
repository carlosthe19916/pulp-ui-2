import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@app/pages/resources/ComingSoon";

export const Route = createFileRoute("/_authenticated/admin/roles/")({
  component: () => <ComingSoon title="Roles" />,
});
