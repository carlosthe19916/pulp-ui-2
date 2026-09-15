import { createFileRoute } from "@tanstack/react-router";

import { RemoteDetailRoute } from "@app/pages/content-management/remotes/remote-details/RemoteDetailRoute";

export const Route = createFileRoute(
  "/_authenticated/content-management/remotes/$remoteId",
)({
  component: RemoteDetailRoute,
});
