import { getRouteApi } from "@tanstack/react-router";

import { RoleDetail } from "./RoleDetail";

const roleDetailRouteApi = getRouteApi("/_authenticated/admin/roles/$roleId");

export const RoleDetailRoute = () => {
  const { roleId } = roleDetailRouteApi.useParams();
  return <RoleDetail roleId={roleId} />;
};
