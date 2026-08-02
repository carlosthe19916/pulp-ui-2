import { createRootRouteWithContext } from "@tanstack/react-router";

import { RootComponent } from "@app/layout/RootLayout";
import { NotFound } from "@app/pages/not-found/not-found";
import type { RouterContext } from "../router";

import "@patternfly/patternfly/patternfly.css";
import "@patternfly/patternfly/patternfly-addons.css";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
});
