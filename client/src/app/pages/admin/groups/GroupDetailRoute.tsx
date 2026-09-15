import { getRouteApi } from "@tanstack/react-router";

import { GroupDetail } from "./GroupDetail";

const routeApi = getRouteApi("/_authenticated/admin/groups/$groupId");

export const GroupDetailRoute = () => {
  const { groupId } = routeApi.useParams();
  return <GroupDetail groupId={groupId} />;
};
