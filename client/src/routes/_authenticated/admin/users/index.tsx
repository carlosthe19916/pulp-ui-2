import { createFileRoute } from "@tanstack/react-router";

import { UserList } from "@app/pages/platform/admin/users/UserList";

export const Route = createFileRoute("/_authenticated/admin/users/")({
  component: UserList,
});
