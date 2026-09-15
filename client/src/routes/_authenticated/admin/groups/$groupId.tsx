import { createFileRoute } from "@tanstack/react-router";

import { GroupDetailRoute } from "@app/pages/admin/groups/group-details/GroupDetailRoute";

export const Route = createFileRoute("/_authenticated/admin/groups/$groupId")({
  component: GroupDetailRoute,
});
