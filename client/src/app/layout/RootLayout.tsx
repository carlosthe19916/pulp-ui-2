import type React from "react";

import { Outlet, useRouterState } from "@tanstack/react-router";

import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { ApiStatusProvider } from "@app/context/ApiStatus/ApiStatusProvider";
import { NotificationsProvider } from "@app/context/Notifications/NotificationsProvider";
import {
  type ContrastMode,
  type ThemeMode,
  type ThemeVariant,
} from "@app/context/Theme/ThemeContext";
import { ThemeProvider } from "@app/context/Theme/ThemeProvider";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useLocalStorage } from "@app/hooks/useStorage";

import { DefaultLayout } from "./DefaultLayout";

export const RootComponent: React.FC = () => {
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
};

interface IWaitForApiStatusProps {
  children: React.ReactNode;
}

export const WaitForApiStatus: React.FC<IWaitForApiStatusProps> = ({
  children,
}) => {
  const apiStatus = useApiStatus();
  return (
    <LoadingWrapper
      isFetching={apiStatus.isLoading}
      fetchError={apiStatus.error}
      fetchErrorState={(error) => (
        <Bullseye>
          <EmptyState
            status="danger"
            titleText="Could not load Server Status"
            headingLevel="h4"
            icon={ExclamationCircleIcon}
            variant={EmptyStateVariant.sm}
          >
            <EmptyStateBody>{error.message}</EmptyStateBody>
          </EmptyState>
        </Bullseye>
      )}
    >
      {children}
    </LoadingWrapper>
  );
};

const RootLayout: React.FC = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = pathname === "/login";

  if (isLoginRoute) {
    return <Outlet />;
  }

  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
};
