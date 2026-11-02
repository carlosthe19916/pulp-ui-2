import { createFileRoute, redirect } from "@tanstack/react-router";

import { DEFAULT_PULP_DOMAIN } from "@app/constants";

// The dashboard's domain cards are scoped by the URL like every domain page (ADR 0002).
export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard/$pulpDomain",
      params: { pulpDomain: DEFAULT_PULP_DOMAIN },
      replace: true,
    });
  },
});
