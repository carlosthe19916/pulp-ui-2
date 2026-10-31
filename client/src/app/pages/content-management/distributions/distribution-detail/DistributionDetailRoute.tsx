import type React from "react";

import { getRouteApi } from "@tanstack/react-router";

import { DistributionDetail } from "./DistributionDetail";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/distributions/$distributionType/$distributionId/",
);

export const DistributionDetailRoute: React.FC = () => {
  const { pulpDomain, distributionType } = routeApi.useParams();
  const { href } = routeApi.useLoaderData();
  return (
    <DistributionDetail
      pulpDomain={pulpDomain}
      pulpType={distributionType}
      href={href}
    />
  );
};
