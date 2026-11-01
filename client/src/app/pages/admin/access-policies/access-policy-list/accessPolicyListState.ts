/** What the Access policies list keeps (page, sort, filters); its route types links with `listSearch`. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IAccessPolicyListParams } from "@app/queries/access-policies";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "viewset_name",
  "customized",
] as const satisfies readonly OrderingField<IAccessPolicyListParams>[];

export const ACCESS_POLICY_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "viewset_name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({ viewset_name: z.string() }),
    defaultValue: { viewset_name: "" },
  }),
});
