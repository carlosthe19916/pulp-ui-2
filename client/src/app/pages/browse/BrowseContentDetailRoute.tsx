import { getRouteApi } from "@tanstack/react-router";

import { BrowseContentDetail } from "./BrowseContentDetail";

const browseContentDetailRouteApi = getRouteApi(
  "/browse/$distributionId/$contentId",
);

export function BrowseContentDetailRoute() {
  const { distributionId, contentId } = browseContentDetailRouteApi.useParams();
  return (
    <BrowseContentDetail
      distributionId={distributionId}
      contentId={contentId}
    />
  );
}
