import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@app/pages/platform/login/LoginPage";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
