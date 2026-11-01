/** What the Roles list keeps (page, sort, filters); its route types links with `listSearch`. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IRoleListParams } from "@app/queries/roles";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "name",
  "locked",
] as const satisfies readonly OrderingField<IRoleListParams>[];

// The `locked` param is a boolean; "" means no filter.
const LOCKED_VALUES = ["", "true", "false"] as const;
export type LockedFilter = (typeof LOCKED_VALUES)[number];

export const isLockedFilter = (value: string): value is LockedFilter =>
  (LOCKED_VALUES as readonly string[]).includes(value);

export const ROLE_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      name: z.string(),
      locked: z.enum(LOCKED_VALUES),
    }),
    defaultValue: { name: "", locked: "" },
  }),
});
