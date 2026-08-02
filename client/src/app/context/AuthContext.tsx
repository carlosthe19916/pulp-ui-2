import React, { useCallback, useEffect, useState } from "react";

import { client, setOnUnauthorized } from "@app/axios-config/apiInit";
import { login as loginApi, loginRead, logout as logoutApi } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

import { AuthContext } from "./auth-context";
import type { AuthContextValue } from "./auth-context";

export type { AuthContextValue } from "./auth-context";

const USERNAME_STORAGE_KEY = "pulp-username";

function clearStoredUser() {
  sessionStorage.removeItem(USERNAME_STORAGE_KEY);
}

function storeUser(username: string) {
  sessionStorage.setItem(USERNAME_STORAGE_KEY, username);
}

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onUnauthorized?: () => void;
}> = ({ children, onUnauthorized }) => {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await logoutApi({
        client,
        path: { pulp_domain: PULP_DOMAIN },
      });
    } catch {
      // Session may already be invalid; still clear local auth state.
    } finally {
      clearStoredUser();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      clearStoredUser();
      setUser(null);
      onUnauthorized?.();
    });
  }, [onUnauthorized]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await loginRead({
          client,
          path: { pulp_domain: PULP_DOMAIN },
        });
        const username =
          response.data?.username ??
          sessionStorage.getItem(USERNAME_STORAGE_KEY);
        if (username) {
          storeUser(username);
          setUser({ username });
        } else {
          clearStoredUser();
          setUser(null);
        }
      } catch {
        clearStoredUser();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void checkSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const credentials = btoa(`${username}:${password}`);
    const response = await loginApi({
      client,
      path: { pulp_domain: PULP_DOMAIN },
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
    const resolvedUsername = response.data?.username ?? username;
    storeUser(resolvedUsername);
    setUser({ username: resolvedUsername });
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
};
