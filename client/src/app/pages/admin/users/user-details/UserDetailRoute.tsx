import type React from "react";

import { getRouteApi } from "@tanstack/react-router";

import { UserDetail } from "./UserDetail";

const routeApi = getRouteApi("/_authenticated/admin/users/$userId");

export const UserDetailRoute: React.FC = () => {
  const { href } = routeApi.useLoaderData();
  return <UserDetail userHref={href} />;
};
