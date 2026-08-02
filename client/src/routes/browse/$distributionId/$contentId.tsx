import { createFileRoute } from "@tanstack/react-router";

import { BrowseContentDetailRoute } from "@app/pages/browse/BrowseContentDetailRoute";

export const Route = createFileRoute("/browse/$distributionId/$contentId")({
  component: BrowseContentDetailRoute,
});
