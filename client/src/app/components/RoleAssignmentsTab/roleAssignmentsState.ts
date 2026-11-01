/** What a user's or group's role assignments list keeps; the screen showing it scopes it. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IRoleAssignmentListParams } from "@app/queries/roleAssignments";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "role",
  "description",
  "pulp_created",
] as const satisfies readonly OrderingField<IRoleAssignmentListParams>[];

export const ROLE_ASSIGNMENTS_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "role", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({ role: z.string() }),
    defaultValue: { role: "" },
  }),
});
