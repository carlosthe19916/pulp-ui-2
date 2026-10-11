import { createFileRoute } from "@tanstack/react-router";

import { RemoteListPage } from "@app/pages/content-management/remotes/remote-list/RemoteListPage";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/remotes/",
)({
  component: RemoteListPage,
});
