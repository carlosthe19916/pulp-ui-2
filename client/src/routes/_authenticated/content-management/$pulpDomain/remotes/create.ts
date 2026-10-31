import { createFileRoute } from "@tanstack/react-router";

import { RemoteCreate } from "@app/pages/content-management/remotes/remote-create/RemoteCreate";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/remotes/create",
)({
  validateSearch: (search: Record<string, unknown>): { type?: string } => ({
    type: typeof search.type === "string" ? search.type : undefined,
  }),
  component: RemoteCreate,
});
