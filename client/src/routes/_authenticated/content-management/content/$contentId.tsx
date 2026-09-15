import { createFileRoute } from "@tanstack/react-router";

import { ContentDetailRoute } from "@app/pages/content-management/content/content-details/ContentDetailRoute";

export const Route = createFileRoute(
  "/_authenticated/content-management/content/$contentId",
)({
  component: ContentDetailRoute,
});
