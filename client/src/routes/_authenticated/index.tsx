import { createFileRoute } from "@tanstack/react-router";

import { Dashboard } from "@app/pages/platform/dashboard/Dashboard";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});
