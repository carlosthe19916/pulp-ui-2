import { createFileRoute } from "@tanstack/react-router";

import { RoleList } from "@app/pages/admin/roles/RoleList";

export const Route = createFileRoute("/_authenticated/admin/roles/")({
  component: RoleList,
});
