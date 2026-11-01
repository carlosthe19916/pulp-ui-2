import { createFileRoute } from "@tanstack/react-router";

import { UserList } from "@app/pages/admin/users/user-list/UserList";
import { USER_LIST_STATE } from "@app/pages/admin/users/user-list/userListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(USER_LIST_STATE);

export const Route = createFileRoute("/_authenticated/admin/users/")({
  validateSearch,
  search,
  component: UserList,
});
