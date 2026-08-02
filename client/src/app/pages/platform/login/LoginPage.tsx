import React, { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { LoginForm, LoginPage as PFLoginPage } from "@patternfly/react-core";

import useBranding from "@app/hooks/useBranding";
import { useAuth } from "@app/context/AuthContext";

export const LoginPage: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const branding = useBranding();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await auth.login(username, password);
      const redirectTo = search.redirect || "/";
      navigate({ to: redirectTo });
    } catch {
      setError("Invalid username or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PFLoginPage
      brandImgSrc={branding.masthead.leftImageUrl}
      brandImgAlt={branding.application.title}
      loginTitle={`Log in to ${branding.application.title}`}
    >
      <LoginForm
        usernameLabel="Username"
        usernameValue={username}
        onChangeUsername={(_e, v) => setUsername(v)}
        passwordLabel="Password"
        passwordValue={password}
        onChangePassword={(_e, v) => setPassword(v)}
        onLoginButtonClick={handleLogin}
        loginButtonLabel={isLoading ? "Logging in..." : "Log in"}
        isLoginButtonDisabled={isLoading || !username || !password}
        showHelperText={!!error}
        helperText={error}
      />
    </PFLoginPage>
  );
};
