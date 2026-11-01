import { createFileRoute } from "@tanstack/react-router";

import { RoleList } from "@app/pages/admin/roles/role-list/RoleList";
import { ROLE_LIST_STATE } from "@app/pages/admin/roles/role-list/roleListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(ROLE_LIST_STATE);

export const Route = createFileRoute("/_authenticated/admin/roles/")({
  validateSearch,
  search,
  component: RoleList,
});
