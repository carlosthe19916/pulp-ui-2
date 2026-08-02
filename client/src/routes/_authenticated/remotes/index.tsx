import { createFileRoute } from "@tanstack/react-router";

import { RemoteList } from "@app/pages/resources/RemoteList";

export const Route = createFileRoute("/_authenticated/remotes/")({
  component: RemoteList,
});
