import { createFileRoute } from "@tanstack/react-router";

import { AnsibleCollectionList } from "@app/pages/content-management/ansible-collections/ansible-collection-list/AnsibleCollectionList";

export const Route = createFileRoute(
  "/_authenticated/content-management/$pulpDomain/ansible-collections/",
)({
  component: AnsibleCollectionList,
});
