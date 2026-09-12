import { createFileRoute } from "@tanstack/react-router";

import { RemoteList } from "@app/pages/content-management/remotes/RemoteList";

export const Route = createFileRoute(
  "/_authenticated/content-management/remotes/",
)({
  component: RemoteList,
});
