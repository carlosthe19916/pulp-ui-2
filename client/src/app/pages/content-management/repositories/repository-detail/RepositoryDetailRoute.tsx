import type React from "react";

import { getRouteApi } from "@tanstack/react-router";

import { RepositoryDetail } from "./RepositoryDetail";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/",
);

export const RepositoryDetailRoute: React.FC = () => {
  const { pulpDomain, repositoryType, repositoryId } = routeApi.useParams();
  const { href } = routeApi.useLoaderData();
  return (
    <RepositoryDetail
      pulpDomain={pulpDomain}
      pulpType={repositoryType}
      id={repositoryId}
      href={href}
    />
  );
};
