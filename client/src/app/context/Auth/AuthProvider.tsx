import type React from "react";

import { ENV } from "@app/env";

import { BasicAuthProvider } from "./BasicAuthProvider";
import { NoAuthProvider } from "./NoAuthProvider";
import { OidcAuthProvider } from "./OidcAuthProvider";

interface IAuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<IAuthProviderProps> = ({ children }) => {
  if (ENV.AUTH === "oidc")
    return <OidcAuthProvider>{children}</OidcAuthProvider>;
  if (ENV.AUTH === "basic")
    return <BasicAuthProvider>{children}</BasicAuthProvider>;
  return <NoAuthProvider>{children}</NoAuthProvider>;
};
