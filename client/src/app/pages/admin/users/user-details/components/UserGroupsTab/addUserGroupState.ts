/** What the "Add Group to User" picker keeps (page, sort, filters). */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IGroupListParams } from "@app/queries/groups";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<IGroupListParams>[];

export const ADD_USER_GROUP_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({ name: z.string() }),
    defaultValue: { name: "" },
  }),
});
