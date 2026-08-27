import { Outlet, useRouterState } from "@tanstack/react-router";

import { LoadingWrapper } from "@app/components/LoadingWrapper";
import {
  ThemeProvider,
  type ContrastMode,
  type ThemeMode,
  type ThemeVariant,
} from "@app/components/Theme";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import { ApiStatusProvider } from "@app/context/ApiStatus/ApiStatusProvider";
import { NotificationsProvider } from "@app/context/NotificationsContext";
import { useLocalStorage } from "@app/hooks/useStorage";
import { use } from "react";
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
        <ApiStatusProvider>
          <WaitForApiStatus>
            <RootLayout />
          </WaitForApiStatus>
        </ApiStatusProvider>
      </NotificationsProvider>
    </ThemeProvider>
  );
}

export const WaitForApiStatus: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const apiStatus = use(ApiStatusContext);
  return (
    <LoadingWrapper isFetching={apiStatus?.isLoading ?? false}>
      {children}
    </LoadingWrapper>
  );
};

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = pathname === "/login";
  const isBrowseRoute =
    pathname === "/browse" || pathname.startsWith("/browse/");

  if (isLoginRoute) {
    return <Outlet />;
  }

  return isBrowseRoute ? (
    <BrowseLayout>
      <Outlet />
    </BrowseLayout>
  ) : (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
}
