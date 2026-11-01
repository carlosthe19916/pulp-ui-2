/** What the tasks table keeps (page, sort, filters); a screen showing it as a tab scopes it. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { ITaskListParams, TaskState } from "@app/queries/tasks";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "name",
  "state",
  "started_at",
  "finished_at",
  "pulp_created",
] as const satisfies readonly OrderingField<ITaskListParams>[];

export const TASK_STATES = [
  "waiting",
  "running",
  "completed",
  "failed",
  "canceled",
  "canceling",
  "skipped",
] as const satisfies readonly TaskState[];

export const TASKS_TABLE_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "pulp_created", direction: "desc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      name: z.string(),
      state: z.array(z.enum(TASK_STATES)),
    }),
    defaultValue: { name: "", state: [] },
  }),
});
