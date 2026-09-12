import { createFileRoute } from "@tanstack/react-router";

import { RoleDetailRoute } from "@app/pages/admin/roles/RoleDetailRoute";

export const Route = createFileRoute("/_authenticated/admin/roles/$roleId")({
  component: RoleDetailRoute,
});
