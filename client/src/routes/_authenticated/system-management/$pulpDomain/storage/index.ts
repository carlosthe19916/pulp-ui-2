import { createFileRoute } from "@tanstack/react-router";

import { Storage } from "@app/pages/system-management/storage/Storage";

export const Route = createFileRoute(
  "/_authenticated/system-management/$pulpDomain/storage/",
)({
  component: Storage,
});
