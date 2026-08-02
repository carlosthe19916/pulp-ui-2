import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginPage } from "@app/pages/platform/login/LoginPage";

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ href: search.redirect || "/" });
    }
  },
  component: LoginPage,
});
