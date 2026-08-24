import React, { useCallback, useMemo } from "react";
import { AuthProvider, useAuth } from "react-oidc-context";

import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { oidcClientSettings, oidcSignoutArgs } from "@app/oidc";
import { AuthContext, type IAuthContext } from "./AuthContext";

export const OidcAuthProvider: React.FC<{ children: React.ReactNode }> = ({
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

const OidcAuthBridge: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();

  const login = useCallback(
    (_redirectTo?: string) => {
      auth
        .signinRedirect({
          url_state: window.location.pathname + window.location.search,
        })
        .then(() => {
          console.log("Redirect to login");
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

  if (auth.isAuthenticated) {
    return <AuthContext value={value}>{children}</AuthContext>;
  }
  if (auth.isLoading) {
    return <AppPlaceholder />;
  }
  if (auth.error) {
    return (
      <Bullseye>
        <EmptyState
          status="danger"
          titleText="Auth Error"
          headingLevel="h4"
          icon={ExclamationCircleIcon}
          variant={EmptyStateVariant.sm}
        >
          <EmptyStateBody>
            {`${auth.error.name}: ${auth.error.message}`}. Check your OIDC
            configuration or contact your admin.
          </EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  return <p>Login in...</p>;
};
