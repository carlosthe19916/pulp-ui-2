import { getRouteApi } from "@tanstack/react-router";

import { DistributionDetail } from "./DistributionDetail";

const distributionDetailRouteApi = getRouteApi(
  "/_authenticated/content-management/distributions/$distId",
);

export function DistributionDetailRoute() {
  const { distId } = distributionDetailRouteApi.useParams();
  return <DistributionDetail distId={distId} />;
}
