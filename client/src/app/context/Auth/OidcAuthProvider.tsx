import type React from "react";
import { useCallback, useMemo } from "react";
import { AuthProvider, useAuth } from "react-oidc-context";

import { Bullseye } from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import { FullPageEmptyState } from "@app/components/FullPageEmptyState";
import { oidcClientSettings, oidcSignoutArgs } from "@app/oidc";

import { AuthContext, type IAuthContext } from "./AuthContext";

interface IOidcAuthProviderProps {
  children: React.ReactNode;
}

export const OidcAuthProvider: React.FC<IOidcAuthProviderProps> = ({
  children,
}) => {
  return (
    <AuthProvider
      {...oidcClientSettings}
      automaticSilentRenew={true}
      onSigninCallback={() => {
        window.history.replaceState({}, "", window.location.pathname || "/");
      }}
    >
      <OidcAuthBridge>{children}</OidcAuthBridge>
    </AuthProvider>
  );
};

interface IOidcAuthBridgeProps {
  children: React.ReactNode;
}

const OidcAuthBridge: React.FC<IOidcAuthBridgeProps> = ({ children }) => {
  const auth = useAuth();

  const login = useCallback(
    (_redirectTo?: string) => {
      void auth.signinRedirect({
        url_state: window.location.pathname + window.location.search,
      });
    },
    [auth],
  );

  const logout = useCallback(async () => {
    await auth.signoutRedirect(oidcSignoutArgs);
  }, [auth]);

  const value: IAuthContext = useMemo(
    () => ({
      user: auth.isAuthenticated
        ? {
            username:
              (auth.user?.profile.preferred_username as string) ??
              auth.user?.profile.sub ??
              "",
          }
        : null,
      isAuthenticated: () => auth.isAuthenticated,
      isLoading: auth.isLoading,
      login,
      logout,
    }),
    [auth, login, logout],
  );

  if (auth.error) {
    return (
      <Bullseye>
        <FullPageEmptyState
          titleText="Authentication error"
          icon={ExclamationCircleIcon}
          status="danger"
          body={`${auth.error.name}: ${auth.error.message}. Check your OIDC configuration or contact your administrator.`}
        />
      </Bullseye>
    );
  }

  return <AuthContext value={value}>{children}</AuthContext>;
};
