import { getRouteApi } from "@tanstack/react-router";

import { PublicationDetail } from "./PublicationDetail";

const publicationDetailRouteApi = getRouteApi(
  "/_authenticated/publications/$pubId",
);

export function PublicationDetailRoute() {
  const { pubId } = publicationDetailRouteApi.useParams();
  return <PublicationDetail pubId={pubId} />;
}
