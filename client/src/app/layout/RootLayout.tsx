import { Outlet, useRouterState } from "@tanstack/react-router";

import {
  ThemeProvider,
  type ContrastMode,
  type ThemeMode,
  type ThemeVariant,
} from "@app/components/Theme";
import { NotificationsProvider } from "@app/context/NotificationsContext";
import { PluginProvider } from "@app/context/PluginContext";
import { useLocalStorage } from "@app/hooks/useStorage";
import { BrowseLayout } from "./browse-layout";
import { DefaultLayout } from "./default-layout";

export function RootComponent() {
  const [mode, setMode] = useLocalStorage<ThemeMode>({
    key: "theme-preference",
    defaultValue: "system",
  });
  const [variant, setVariant] = useLocalStorage<ThemeVariant>({
    key: "theme-variant-preference",
    defaultValue: "default",
  });
  const [contrast, setContrast] = useLocalStorage<ContrastMode>({
    key: "contrast-preference",
    defaultValue: "system",
  });

  return (
    <ThemeProvider
      mode={mode}
      setMode={setMode}
      variant={variant}
      setVariant={setVariant}
      contrast={contrast}
      setContrast={setContrast}
    >
      <NotificationsProvider>
        <RootLayout />
      </NotificationsProvider>
    </ThemeProvider>
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
