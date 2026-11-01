import { createFileRoute } from "@tanstack/react-router";

import { GroupList } from "@app/pages/admin/groups/group-list/GroupList";
import { GROUP_LIST_STATE } from "@app/pages/admin/groups/group-list/groupListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(GROUP_LIST_STATE);

export const Route = createFileRoute("/_authenticated/admin/groups/")({
  validateSearch,
  search,
  component: GroupList,
});
