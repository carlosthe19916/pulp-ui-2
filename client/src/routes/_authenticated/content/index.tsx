import { createFileRoute } from "@tanstack/react-router";

import { ContentList } from "@app/pages/resources/ContentList";

export const Route = createFileRoute("/_authenticated/content/")({
  component: ContentList,
});
