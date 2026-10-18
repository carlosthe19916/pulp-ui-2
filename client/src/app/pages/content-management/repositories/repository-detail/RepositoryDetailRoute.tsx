import { getRouteApi } from "@tanstack/react-router";

import { RepositoryDetail } from "./RepositoryDetail";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/",
);

export const RepositoryDetailRoute = () => {
  const { pulpDomain, repositoryType, repositoryId } = routeApi.useParams();
  return (
    <RepositoryDetail
      pulpDomain={pulpDomain}
      pulpType={repositoryType}
      id={repositoryId}
    />
  );
};
