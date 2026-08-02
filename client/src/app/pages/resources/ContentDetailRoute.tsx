import { getRouteApi } from "@tanstack/react-router";

import { ContentDetail } from "./ContentDetail";

const contentDetailRouteApi = getRouteApi("/_authenticated/content/$contentId");

export function ContentDetailRoute() {
  const { contentId } = contentDetailRouteApi.useParams();
  return <ContentDetail contentId={contentId} />;
}
