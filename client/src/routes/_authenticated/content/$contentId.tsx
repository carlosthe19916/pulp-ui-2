import { createFileRoute } from "@tanstack/react-router";

import { ContentDetailRoute } from "@app/pages/resources/ContentDetailRoute";

export const Route = createFileRoute("/_authenticated/content/$contentId")({
  component: ContentDetailRoute,
});
