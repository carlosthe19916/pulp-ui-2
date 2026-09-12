import { createFileRoute } from "@tanstack/react-router";

import { GroupList } from "@app/pages/admin/groups/GroupList";

export const Route = createFileRoute("/_authenticated/admin/groups/")({
  component: GroupList,
});
