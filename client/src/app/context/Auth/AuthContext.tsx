import { createContext } from "react";

export interface User {
  username: string;
}

export interface IAuthContext {
  user: User | null;
  isAuthenticated: () => boolean;
  isLoading: boolean;
  /** Start the login flow (OIDC redirect, or route guard redirect to /login). */
  login: (redirectTo?: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<IAuthContext | null>(null);
