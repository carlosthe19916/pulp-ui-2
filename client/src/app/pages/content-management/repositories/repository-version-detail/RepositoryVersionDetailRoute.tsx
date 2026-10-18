import { getRouteApi } from "@tanstack/react-router";

import { RepositoryVersionDetail } from "./RepositoryVersionDetail";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber",
);

export const RepositoryVersionDetailRoute = () => {
  const { pulpDomain, repositoryType, repositoryId, versionNumber } =
    routeApi.useParams();
  return (
    <RepositoryVersionDetail
      pulpDomain={pulpDomain}
      pulpType={repositoryType}
      id={repositoryId}
      versionNumber={versionNumber}
    />
  );
};
