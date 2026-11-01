import type React from "react";

import { getRouteApi } from "@tanstack/react-router";

import { PublicationDetail } from "./PublicationDetail";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/publications/$publicationType/$publicationId/",
);

export const PublicationDetailRoute: React.FC = () => {
  const { pulpDomain, publicationType } = routeApi.useParams();
  const { href } = routeApi.useLoaderData();
  return (
    <PublicationDetail
      pulpDomain={pulpDomain}
      pulpType={publicationType}
      href={href}
    />
  );
};
