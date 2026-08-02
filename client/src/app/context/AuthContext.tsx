import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { client, setOnUnauthorized } from "@app/axios-config/apiInit";
import { login as loginApi } from "@app/client";
import { statusRead } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

interface User {
  username: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onUnauthorized?: () => void;
}> = ({ children, onUnauthorized }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    if (onUnauthorized) {
      setOnUnauthorized(() => {
        logout();
        onUnauthorized();
      });
    }
  }, [onUnauthorized, logout]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        await statusRead({ client });
        const storedUsername = sessionStorage.getItem("pulp-username");
        if (storedUsername) {
          setUser({ username: storedUsername });
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const credentials = btoa(`${username}:${password}`);
    await loginApi({
      client,
      path: { pulp_domain: PULP_DOMAIN },
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
    sessionStorage.setItem("pulp-username", username);
    setUser({ username });
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
