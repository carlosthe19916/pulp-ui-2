import { createFileRoute } from "@tanstack/react-router";

import { AccessPolicyList } from "@app/pages/admin/access-policies/access-policy-list/AccessPolicyList";

export const Route = createFileRoute("/_authenticated/admin/access-policies/")({
  component: AccessPolicyList,
});
