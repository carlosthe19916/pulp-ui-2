import type React from "react";

import { AuthContext, type IAuthContext } from "./AuthContext";

const noAuthValue: IAuthContext = {
  user: null,
  isAuthenticated: () => true,
  isLoading: false,
  login: () => {},
  logout: () => {},
};

export const NoAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <AuthContext value={noAuthValue}>{children}</AuthContext>;
};
