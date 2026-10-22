import { getRouteApi } from "@tanstack/react-router";

import { GroupDetail } from "./GroupDetail";

const routeApi = getRouteApi("/_authenticated/admin/groups/$groupId");

export const GroupDetailRoute = () => {
  const { href } = routeApi.useLoaderData();
  return <GroupDetail groupHref={href} />;
};
