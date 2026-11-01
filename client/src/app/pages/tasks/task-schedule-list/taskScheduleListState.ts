/**
 * What the Task schedules list keeps (page, sort, filters). `TaskScheduleList` reads each piece
 * with `usePersistentState`; its route passes `listSearch(TASK_SCHEDULE_LIST_STATE)` for typed links.
 */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { ITaskScheduleListParams } from "@app/queries/task-schedules";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "name",
  "task_name",
  "next_dispatch",
] as const satisfies readonly OrderingField<ITaskScheduleListParams>[];

export const TASK_SCHEDULE_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "next_dispatch", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({ name: z.string() }),
    defaultValue: { name: "" },
  }),
});
