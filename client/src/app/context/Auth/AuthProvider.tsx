import ENV from "@app/env";
import { BasicAuthProvider } from "./BasicAuthProvider";
import { NoAuthProvider } from "./NoAuthProvider";
import { OidcAuthProvider } from "./OidcAuthProvider";

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  if (ENV.AUTH === "oidc")
    return <OidcAuthProvider>{children}</OidcAuthProvider>;
  if (ENV.AUTH === "basic")
    return <BasicAuthProvider>{children}</BasicAuthProvider>;
  return <NoAuthProvider>{children}</NoAuthProvider>;
};
