import type React from "react";

import { AuthContext, type IAuthContext } from "./AuthContext";

const noAuthValue: IAuthContext = {
  user: null,
  isAuthenticated: () => true,
  isLoading: false,
  login: () => {},
  logout: () => {},
};

interface INoAuthProviderProps {
  children: React.ReactNode;
}

export const NoAuthProvider: React.FC<INoAuthProviderProps> = ({
  children,
}) => {
  return <AuthContext value={noAuthValue}>{children}</AuthContext>;
};
