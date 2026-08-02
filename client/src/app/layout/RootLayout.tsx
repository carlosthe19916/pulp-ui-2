import { Outlet, useRouterState } from "@tanstack/react-router";

import { NotificationsProvider } from "@app/context/NotificationsContext";
import { PluginProvider } from "@app/context/PluginContext";
import { BrowseLayout } from "./browse-layout";
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
  const isBrowseRoute =
    pathname === "/browse" || pathname.startsWith("/browse/");

  if (isLoginRoute) {
    return <Outlet />;
  }

  return (
    <PluginProvider>
      {isBrowseRoute ? (
        <BrowseLayout>
          <Outlet />
        </BrowseLayout>
      ) : (
        <DefaultLayout>
          <Outlet />
        </DefaultLayout>
      )}
    </PluginProvider>
  );
}
