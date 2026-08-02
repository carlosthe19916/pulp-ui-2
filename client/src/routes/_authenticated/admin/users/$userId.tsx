import { createFileRoute } from "@tanstack/react-router";

import { UserDetailRoute } from "@app/pages/platform/admin/users/UserDetailRoute";

export const Route = createFileRoute("/_authenticated/admin/users/$userId")({
  component: UserDetailRoute,
});
