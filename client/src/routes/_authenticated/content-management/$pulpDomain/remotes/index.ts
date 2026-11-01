import { createFileRoute } from "@tanstack/react-router";

import { RemoteList } from "@app/pages/content-management/remotes/remote-list/RemoteList";
import { REMOTE_LIST_STATE } from "@app/pages/content-management/remotes/remote-list/remoteListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(REMOTE_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/remotes/",
)({
  validateSearch,
  search,
  component: RemoteList,
});
