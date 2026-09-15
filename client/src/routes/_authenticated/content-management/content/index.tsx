import { createFileRoute } from "@tanstack/react-router";

import { ContentList } from "@app/pages/content-management/content/content-list/ContentList";

export const Route = createFileRoute(
  "/_authenticated/content-management/content/",
)({
  component: ContentList,
});
