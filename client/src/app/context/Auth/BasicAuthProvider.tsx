import React, { useCallback, useMemo, useSyncExternalStore } from "react";

import { redirect } from "@tanstack/react-router";

import { AuthContext, type IAuthContext } from "./AuthContext";
import {
  clearCredentials,
  getSnapshot,
  loadCredentials,
  subscribe,
  type IStoredCredentials,
} from "./basicAuthHelpers";
import { router } from "../../../router.ts";

export const BasicAuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const user = useMemo(() => {
    if (!raw) {
      return null;
    }
    try {
      const credentials = JSON.parse(raw) as IStoredCredentials;
      return { username: credentials.username };
    } catch {
      return null;
    }
  }, [raw]);

  const isAuthenticated = useCallback(() => loadCredentials() !== null, []);

  const login = useCallback((redirectTo?: string) => {
    throw redirect({
      to: "/login",
      search: { redirect: redirectTo },
    });
  }, []);

  const logout = useCallback(() => {
    clearCredentials();
    void router.navigate({ to: "/login" });
  }, []);

  const value: IAuthContext = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading: false,
      login,
      logout,
    }),
    [user, isAuthenticated, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
};
