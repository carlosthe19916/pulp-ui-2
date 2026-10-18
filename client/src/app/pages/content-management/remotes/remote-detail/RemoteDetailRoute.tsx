import { getRouteApi } from "@tanstack/react-router";

import { RemoteDetail } from "./RemoteDetail";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/remotes/$remoteType/$remoteId/",
);

export const RemoteDetailRoute = () => {
  const { pulpDomain, remoteType, remoteId } = routeApi.useParams();
  return (
    <RemoteDetail pulpDomain={pulpDomain} pulpType={remoteType} id={remoteId} />
  );
};
