import { getRouteApi } from "@tanstack/react-router";

import { RepositoryDetail } from "./RepositoryDetail";

const repositoryDetailRouteApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/repositories/$repoId",
);

export const RepositoryDetailRoute = () => {
  const { repoId } = repositoryDetailRouteApi.useParams();
  return <RepositoryDetail repoId={repoId} />;
};
