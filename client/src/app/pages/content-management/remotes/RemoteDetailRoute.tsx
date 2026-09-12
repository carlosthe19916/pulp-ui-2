import { getRouteApi } from "@tanstack/react-router";

import { RemoteDetail } from "./RemoteDetail";

const remoteDetailRouteApi = getRouteApi(
  "/_authenticated/content-management/remotes/$remoteId",
);

export function RemoteDetailRoute() {
  const { remoteId } = remoteDetailRouteApi.useParams();
  return <RemoteDetail remoteId={remoteId} />;
}
