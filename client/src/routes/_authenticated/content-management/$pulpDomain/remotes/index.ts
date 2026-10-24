import { createFileRoute } from "@tanstack/react-router";

import { RemoteList } from "@app/pages/content-management/remotes/remote-list/RemoteList";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/remotes/",
)({
  component: RemoteList,
});
