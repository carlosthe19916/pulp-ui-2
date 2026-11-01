/**
 * What the Upstream Pulps list keeps (page, filters). `UpstreamPulpList` reads each piece with
 * `usePersistentState`; its route passes `listSearch(UPSTREAM_PULP_LIST_STATE)` for typed links.
 */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const UPSTREAM_PULP_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  filters: definePersistentState({
    key: "filters",
    schema: z.object({ name: z.string() }),
    defaultValue: { name: "" },
  }),
});
