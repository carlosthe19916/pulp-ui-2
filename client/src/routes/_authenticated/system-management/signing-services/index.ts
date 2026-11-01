import { createFileRoute } from "@tanstack/react-router";

import { SigningServiceList } from "@app/pages/system-management/signing-services/SigningServiceList";
import { SIGNING_SERVICE_LIST_STATE } from "@app/pages/system-management/signing-services/signingServiceListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(SIGNING_SERVICE_LIST_STATE);

export const Route = createFileRoute(
  "/_authenticated/system-management/signing-services/",
)({
  validateSearch,
  search,
  component: SigningServiceList,
});
