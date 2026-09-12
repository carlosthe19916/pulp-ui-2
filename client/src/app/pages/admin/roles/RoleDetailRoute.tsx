import { getRouteApi } from "@tanstack/react-router";

import { RoleDetail } from "./RoleDetail";

const roleDetailRouteApi = getRouteApi("/_authenticated/admin/roles/$roleId");

export function RoleDetailRoute() {
  const { roleId } = roleDetailRouteApi.useParams();
  return <RoleDetail roleId={roleId} />;
}
