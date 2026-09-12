import { getRouteApi } from "@tanstack/react-router";

import { RepositoryDetail } from "./RepositoryDetail";

const repositoryDetailRouteApi = getRouteApi(
  "/_authenticated/content-management/repositories/$repoId",
);

export function RepositoryDetailRoute() {
  const { repoId } = repositoryDetailRouteApi.useParams();
  return <RepositoryDetail repoId={repoId} />;
}
