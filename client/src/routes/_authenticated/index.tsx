import { createFileRoute } from "@tanstack/react-router";

import { Dashboard } from "@app/pages/dashboard/Dashboard";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});
