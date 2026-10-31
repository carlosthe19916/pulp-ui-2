import type React from "react";

import { getRouteApi } from "@tanstack/react-router";

import { RepositoryEdit } from "./RepositoryEdit";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/edit",
);

export const RepositoryEditRoute: React.FC = () => {
  const { pulpDomain, repositoryType } = routeApi.useParams();
  const { href } = routeApi.useLoaderData();
  return (
    <RepositoryEdit
      pulpDomain={pulpDomain}
      pulpType={repositoryType}
      href={href}
    />
  );
};
