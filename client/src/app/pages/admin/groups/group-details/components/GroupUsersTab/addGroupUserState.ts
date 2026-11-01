/** What the "Add User to Group" picker keeps (page, sort, filters). */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IUserListParams } from "@app/queries/users";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "username",
  "email",
] as const satisfies readonly OrderingField<IUserListParams>[];

export const ADD_GROUP_USER_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "username", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({ username: z.string() }),
    defaultValue: { username: "" },
  }),
});
