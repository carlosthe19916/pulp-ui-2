import { getRouteApi } from "@tanstack/react-router";

import { UserDetail } from "./UserDetail";

const userDetailRouteApi = getRouteApi("/_authenticated/admin/users/$userId");

export function UserDetailRoute() {
  const { userId } = userDetailRouteApi.useParams();
  return <UserDetail userId={userId} />;
}
