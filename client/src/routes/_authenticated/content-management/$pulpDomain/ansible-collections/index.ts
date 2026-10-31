import { createFileRoute } from "@tanstack/react-router";

import { pluginPage } from "@app/components/PluginPage";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/ansible-collections/",
)({
  component: pluginPage("/content-management/$pulpDomain/ansible-collections"),
});
