import { getRouteApi } from "@tanstack/react-router";

import { PublicationDetail } from "./PublicationDetail";

const publicationDetailRouteApi = getRouteApi(
  "/_authenticated/content-management/publications/$pubId",
);

export function PublicationDetailRoute() {
  const { pubId } = publicationDetailRouteApi.useParams();
  return <PublicationDetail pubId={pubId} />;
}
