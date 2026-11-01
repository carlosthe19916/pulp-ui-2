import { createFileRoute } from "@tanstack/react-router";

import { AccessPolicyList } from "@app/pages/admin/access-policies/access-policy-list/AccessPolicyList";
import { ACCESS_POLICY_LIST_STATE } from "@app/pages/admin/access-policies/access-policy-list/accessPolicyListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(ACCESS_POLICY_LIST_STATE);

export const Route = createFileRoute("/_authenticated/admin/access-policies/")({
  validateSearch,
  search,
  component: AccessPolicyList,
});
