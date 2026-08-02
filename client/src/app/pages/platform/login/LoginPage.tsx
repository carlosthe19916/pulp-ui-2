import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useSearch } from "@tanstack/react-router";
import * as yup from "yup";

import { LoginForm, LoginPage as PFLoginPage } from "@patternfly/react-core";

import { useAuth } from "@app/context/useAuth";
import useBranding from "@app/hooks/useBranding";

const loginSchema = yup.object({
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required"),
});

type LoginFormValues = yup.InferType<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const branding = useBranding();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const username = watch("username");
  const password = watch("password");

  // Keep RHF register in sync with PatternFly controlled inputs
  register("username");
  register("password");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await auth.login(values.username, values.password);
      await navigate({ href: redirect || "/" });
    } catch {
      setError("root", { message: "Invalid username or password." });
    }
  });

  return (
    <PFLoginPage
      brandImgSrc={branding.masthead.leftBrand?.src}
      brandImgAlt={
        branding.masthead.leftBrand?.alt ?? branding.application.title
      }
      loginTitle={`Log in to ${branding.application.title}`}
    >
      <LoginForm
        usernameLabel="Username"
        usernameValue={username}
        onChangeUsername={(_e, v) =>
          setValue("username", v, { shouldValidate: true })
        }
        passwordLabel="Password"
        passwordValue={password}
        onChangePassword={(_e, v) =>
          setValue("password", v, { shouldValidate: true })
        }
        onLoginButtonClick={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
        loginButtonLabel={isSubmitting ? "Logging in..." : "Log in"}
        isLoginButtonDisabled={isSubmitting || !username || !password}
        showHelperText={!!(errors.root || errors.username || errors.password)}
        helperText={
          errors.root?.message ||
          errors.username?.message ||
          errors.password?.message
        }
      />
    </PFLoginPage>
  );
};
