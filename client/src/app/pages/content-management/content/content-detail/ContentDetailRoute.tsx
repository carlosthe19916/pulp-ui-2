import { getRouteApi } from "@tanstack/react-router";

import { ContentDetail } from "./ContentDetail";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/content/$contentType/$contentId/",
);

export const ContentDetailRoute = () => {
  const { pulpDomain, contentType, contentId } = routeApi.useParams();
  const { href } = routeApi.useLoaderData();
  return (
    <ContentDetail
      pulpDomain={pulpDomain}
      pulpType={contentType}
      id={contentId}
      href={href}
    />
  );
};
