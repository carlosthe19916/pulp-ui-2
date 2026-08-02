import { createFileRoute } from "@tanstack/react-router";

import { ContentBrowserRoute } from "@app/pages/browse/ContentBrowserRoute";

export const Route = createFileRoute("/browse/$distributionId/")({
  component: ContentBrowserRoute,
});
