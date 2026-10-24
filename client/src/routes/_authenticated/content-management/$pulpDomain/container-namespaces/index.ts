import { createFileRoute } from "@tanstack/react-router";

import { ContainerNamespaceList } from "@app/pages/content-management/container-namespaces/container-namespace-list/ContainerNamespaceList";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/container-namespaces/",
)({
  component: ContainerNamespaceList,
});
