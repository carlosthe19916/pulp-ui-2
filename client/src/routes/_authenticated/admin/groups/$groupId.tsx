import { createFileRoute } from "@tanstack/react-router";

import { GroupDetailRoute } from "@app/pages/platform/admin/groups/GroupDetailRoute";

export const Route = createFileRoute("/_authenticated/admin/groups/$groupId")({
  component: GroupDetailRoute,
});
