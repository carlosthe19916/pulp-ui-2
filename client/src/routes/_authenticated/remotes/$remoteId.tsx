import { createFileRoute } from "@tanstack/react-router";

import { RemoteDetailRoute } from "@app/pages/resources/RemoteDetailRoute";

export const Route = createFileRoute("/_authenticated/remotes/$remoteId")({
  component: RemoteDetailRoute,
});
