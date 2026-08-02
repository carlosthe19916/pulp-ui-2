import { getRouteApi } from "@tanstack/react-router";

import { ContentBrowser } from "./ContentBrowser";

const browseDistributionRouteApi = getRouteApi("/browse/$distributionId/");

export function ContentBrowserRoute() {
  const { distributionId } = browseDistributionRouteApi.useParams();
  return <ContentBrowser distributionId={distributionId} />;
}
