import type React from "react";

import { getRouteApi } from "@tanstack/react-router";

import { RemoteEdit } from "./RemoteEdit";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/remotes/$remoteType/$remoteId/edit",
);

export const RemoteEditRoute: React.FC = () => {
  const { pulpDomain, remoteType } = routeApi.useParams();
  const { href } = routeApi.useLoaderData();
  return (
    <RemoteEdit pulpDomain={pulpDomain} pulpType={remoteType} href={href} />
  );
};
