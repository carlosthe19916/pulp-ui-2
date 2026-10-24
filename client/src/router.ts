import { createRouter } from "@tanstack/react-router";

import type { IAuthContext } from "@app/context/Auth/AuthContext";
import { queryClient } from "@app/queries/config";

import { routeTree } from "./routeTree.gen";

export interface IRouterContext {
  queryClient: typeof queryClient;
  auth: IAuthContext | null;
}

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: null,
  },
  defaultPreload: "intent",
});

export type AppRouter = typeof router;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
