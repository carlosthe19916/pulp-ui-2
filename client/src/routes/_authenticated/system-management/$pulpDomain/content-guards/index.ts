import { createFileRoute } from "@tanstack/react-router";

import { ContentGuardList } from "@app/pages/system-management/content-guards/content-guard-list/ContentGuardList";

export const Route = createFileRoute(
  "/_authenticated/system-management/$pulpDomain/content-guards/",
)({
  component: ContentGuardList,
});
