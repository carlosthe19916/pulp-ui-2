import { createFileRoute, redirect } from "@tanstack/react-router";

import ENV from "@app/env";
import { LoginPage } from "@app/pages/platform/login/LoginPage";

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    if (ENV.AUTH !== "basic") {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});
