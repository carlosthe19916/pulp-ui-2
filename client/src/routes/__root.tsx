import { createRootRouteWithContext } from "@tanstack/react-router";

import { RouteErrorFallback } from "@app/components/RouteErrorFallback";
import { RootComponent } from "@app/layout/RootLayout";
import { NotFound } from "@app/pages/not-found/not-found";
import type { IRouterContext } from "../router";

import "@patternfly/react-core/dist/styles/base.css";

export const Route = createRootRouteWithContext<IRouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RouteErrorFallback,
});
