import { createFileRoute } from "@tanstack/react-router";

import { RoleList } from "@app/pages/admin/roles/role-list/RoleList";

export const Route = createFileRoute("/_authenticated/admin/roles/")({
  component: RoleList,
});
