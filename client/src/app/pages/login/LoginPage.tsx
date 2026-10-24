import type React from "react";
import { useState } from "react";

import { getRouteApi, useNavigate } from "@tanstack/react-router";

import pfBackground from "@patternfly/patternfly/assets/images/pf-background.svg";
import {
  ListItem,
  ListVariant,
  LoginFooterItem,
  LoginForm,
  LoginPage as PFLoginPage,
} from "@patternfly/react-core";
import RhUiErrorFillIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-error-fill-icon";

import { ThemeSelector } from "@app/components/ThemeSelector";
import { DEFAULT_PULP_DOMAIN } from "@app/constants";
import {
  encodeBasicAuthHeader,
  saveCredentials,
} from "@app/context/Auth/basicAuthHelpers";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useTheme } from "@app/hooks/useTheme";
import { getBranding } from "@app/utils/branding";

const INVALID_CREDENTIALS = "Invalid login credentials.";
const SERVER_ERROR = "Server error. Please come back later.";
const storageWarning =
  "Pulp UI is currently using HTTP Basic Authentication. Your credentials will be stored in your browser's sessionStorage or localStorage, in plain text.";

const routeApi = getRouteApi("/login");

export const LoginPage: React.FC = () => {
  const apiStatus = useApiStatus();

  const navigate = useNavigate();
  const { redirect } = routeApi.useSearch();
  const branding = getBranding();
  const { isGlass } = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isValidUsername, setIsValidUsername] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [showHelperText, setShowHelperText] = useState(false);
  const [helperText, setHelperText] = useState("");
  const [isRememberMeChecked, setIsRememberMeChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearHelperText = () => {
    setShowHelperText(false);
    setIsValidUsername(true);
    setIsValidPassword(true);
  };

  const handleUsernameChange = (_event: unknown, value: string) => {
    setUsername(value);
    clearHelperText();
  };

  const handlePasswordChange = (_event: unknown, value: string) => {
    setPassword(value);
    clearHelperText();
  };

  const showInvalidCredentials = ({
    usernameValid,
    passwordValid,
  }: {
    usernameValid: boolean;
    passwordValid: boolean;
  }) => {
    setIsValidUsername(usernameValid);
    setIsValidPassword(passwordValid);
    setHelperText(INVALID_CREDENTIALS);
    setShowHelperText(true);
  };

  const showServerError = () => {
    setHelperText(SERVER_ERROR);
    setShowHelperText(true);
  };

  const onLoginButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void login();
  };

  const login = async () => {
    const usernameValid = !!username;
    const passwordValid = !!password;
    if (!usernameValid || !passwordValid) {
      showInvalidCredentials({ usernameValid, passwordValid });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        apiStatus.status?.domain_enabled
          ? `/api/pulp/${DEFAULT_PULP_DOMAIN}/api/v3/groups/?limit=1&offset=0`
          : `/api/pulp/api/v3/groups/?limit=1&offset=0`,
        {
          headers: {
            Authorization: encodeBasicAuthHeader({ username, password }),
          },
          credentials: "omit",
        },
      );
      if (response.status === 401) {
        showInvalidCredentials({ usernameValid: false, passwordValid: false });
        return;
      }
      if (!response.ok) {
        showServerError();
        return;
      }
    } catch {
      showServerError();
      return;
    } finally {
      setIsSubmitting(false);
    }

    saveCredentials({
      username,
      password,
      remember: isRememberMeChecked,
    });
    if (redirect) {
      await navigate({ href: redirect });
    } else {
      await navigate({ to: "/" });
    }
  };

  const supportUrl = branding.masthead.supportUrl;
  const documentationUrl = branding.about.documentationUrl;
  const footerListItems =
    supportUrl || documentationUrl ? (
      <>
        {supportUrl ? (
          <ListItem>
            <LoginFooterItem href={supportUrl}>Help</LoginFooterItem>
          </ListItem>
        ) : null}
        {documentationUrl ? (
          <ListItem>
            <LoginFooterItem href={documentationUrl}>
              Documentation
            </LoginFooterItem>
          </ListItem>
        ) : null}
      </>
    ) : null;

  return (
    <PFLoginPage
      brandImgProps={
        branding.masthead.leftBrand
          ? {
              src: branding.masthead.leftBrand.src,
              alt: branding.masthead.leftBrand.alt,
            }
          : undefined
      }
      backgroundImgSrc={isGlass ? undefined : pfBackground}
      footerListVariants={ListVariant.inline}
      footerListItems={footerListItems}
      textContent={storageWarning}
      loginTitle="Log in to your account"
      loginSubtitle="Enter your username and password."
      headerUtilities={<ThemeSelector id="theme-selector-login" />}
    >
      <LoginForm
        showHelperText={showHelperText}
        helperText={helperText}
        helperTextIcon={<RhUiErrorFillIcon />}
        usernameLabel="Username"
        usernameValue={username}
        onChangeUsername={handleUsernameChange}
        isValidUsername={isValidUsername}
        passwordLabel="Password"
        passwordValue={password}
        onChangePassword={handlePasswordChange}
        isValidPassword={isValidPassword}
        isShowPasswordEnabled
        rememberMeLabel="Keep credentials in localStorage."
        isRememberMeChecked={isRememberMeChecked}
        onChangeRememberMe={(_e, checked) => setIsRememberMeChecked(checked)}
        onLoginButtonClick={onLoginButtonClick}
        loginButtonLabel={isSubmitting ? "Logging in..." : "Log in"}
        isLoginButtonDisabled={isSubmitting}
      />
    </PFLoginPage>
  );
};
