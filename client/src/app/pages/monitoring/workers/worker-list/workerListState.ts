/** What the Workers list keeps (page, sort, filters); its route types links with `listSearch`. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { OrderingField } from "@app/queries/utils/listParams";
import type { IWorkerListParams } from "@app/queries/workers";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "name",
  "last_heartbeat",
  "pulp_created",
] as const satisfies readonly OrderingField<IWorkerListParams>[];

// "" means no status filter.
const STATUS_VALUES = ["", "online", "missing"] as const;
export type WorkerStatusFilter = (typeof STATUS_VALUES)[number];

export const isWorkerStatusFilter = (
  value: string,
): value is WorkerStatusFilter =>
  (STATUS_VALUES as readonly string[]).includes(value);

export const WORKER_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      name: z.string(),
      status: z.enum(STATUS_VALUES),
    }),
    defaultValue: { name: "", status: "" },
  }),
});
