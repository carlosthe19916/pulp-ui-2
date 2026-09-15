import { getRouteApi } from "@tanstack/react-router";

import { PublicationDetail } from "./PublicationDetail";

const publicationDetailRouteApi = getRouteApi(
  "/_authenticated/content-management/publications/$pubId",
);

export const PublicationDetailRoute = () => {
  const { pubId } = publicationDetailRouteApi.useParams();
  return <PublicationDetail pubId={pubId} />;
};
