import { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { AuthProvider, useAuth } from "@app/context/AuthContext";
import { NotificationsProvider } from "@app/context/NotificationsContext";
import { PluginProvider } from "@app/context/PluginContext";
import { DefaultLayout } from "@app/layout";

import "@patternfly/patternfly/patternfly.css";
import "@patternfly/patternfly/patternfly-addons.css";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <RootLayout />
      </NotificationsProvider>
    </AuthProvider>
  );
}

function RootLayout() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <AppPlaceholder />;
  }

  return (
    <PluginProvider>
      <DefaultLayout>
        <Outlet />
      </DefaultLayout>
    </PluginProvider>
  );
}
