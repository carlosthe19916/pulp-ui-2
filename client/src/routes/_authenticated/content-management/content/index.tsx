import { createFileRoute } from "@tanstack/react-router";

import { ContentList } from "@app/pages/content-management/content/ContentList";

export const Route = createFileRoute(
  "/_authenticated/content-management/content/",
)({
  component: ContentList,
});
