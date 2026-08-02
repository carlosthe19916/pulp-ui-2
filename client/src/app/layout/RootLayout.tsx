import { Outlet, useRouterState } from "@tanstack/react-router";

import { NotificationsProvider } from "@app/context/NotificationsContext";
import { PluginProvider } from "@app/context/PluginContext";
import { DefaultLayout } from "./default-layout";

export function RootComponent() {
  return (
    <NotificationsProvider>
      <RootLayout />
    </NotificationsProvider>
  );
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = pathname === "/login";

  if (isLoginRoute) {
    return <Outlet />;
  }

  return (
    <PluginProvider>
      <DefaultLayout>
        <Outlet />
      </DefaultLayout>
    </PluginProvider>
  );
}
