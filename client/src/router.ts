import { createRouter } from "@tanstack/react-router";

import type { AuthContextValue } from "@app/context/AuthContext";
import { queryClient } from "@app/queries/config";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
  queryClient: typeof queryClient;
  auth: AuthContextValue;
}

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  defaultPreload: "intent",
});

export type AppRouter = typeof router;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
