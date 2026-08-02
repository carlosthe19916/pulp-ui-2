import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@app/pages/resources/ComingSoon";

export const Route = createFileRoute("/_authenticated/admin/users/")({
  component: () => <ComingSoon title="Users" />,
});
