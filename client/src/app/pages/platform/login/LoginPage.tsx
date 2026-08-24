import React, { use, useState } from "react";

import { useNavigate, useSearch } from "@tanstack/react-router";

import {
  ListItem,
  ListVariant,
  LoginFooterItem,
  LoginForm,
  LoginPage as PFLoginPage,
} from "@patternfly/react-core";
import RhUiErrorFillIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-error-fill-icon";
import pfBackground from "@patternfly/patternfly/assets/images/pf-background.svg";

import { ThemeContext, ThemeSelector } from "@app/components/Theme";
import {
  encodeBasicAuthHeader,
  saveCredentials,
} from "@app/context/Auth/basicAuthHelpers";
import { PULP_DOMAIN } from "@app/Constants";
import useBranding from "@app/hooks/useBranding";

const INVALID_CREDENTIALS = "Invalid login credentials.";
const SERVER_ERROR = "Server error. Please come back later.";
const storageWarning =
  "Pulp UI is currently using HTTP Basic Authentication. Your credentials will be stored in your browser's sessionStorage or localStorage, in plain text.";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const branding = useBranding();
  const { isGlass } = use(ThemeContext);

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

  const showInvalidCredentials = (
    usernameValid: boolean,
    passwordValid: boolean,
  ) => {
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
      showInvalidCredentials(usernameValid, passwordValid);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/pulp/${PULP_DOMAIN}/api/v3/groups/?limit=0&offset=0`,
        {
          headers: {
            Authorization: encodeBasicAuthHeader(username, password),
          },
          credentials: "omit",
        },
      );
      if (response.status === 401) {
        showInvalidCredentials(false, false);
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
