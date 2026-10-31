import type React from "react";

import { getRouteApi } from "@tanstack/react-router";

import { DistributionEdit } from "./DistributionEdit";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/distributions/$distributionType/$distributionId/edit",
);

export const DistributionEditRoute: React.FC = () => {
  const { pulpDomain, distributionType } = routeApi.useParams();
  const { href } = routeApi.useLoaderData();
  return (
    <DistributionEdit
      pulpDomain={pulpDomain}
      pulpType={distributionType}
      href={href}
    />
  );
};
