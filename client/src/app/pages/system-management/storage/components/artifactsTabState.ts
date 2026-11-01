/** What the Artifacts tab keeps (page, sort, filters, the orphaned switch). */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IArtifactListParams } from "@app/queries/artifacts";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "size",
  "pulp_created",
] as const satisfies readonly OrderingField<IArtifactListParams>[];

export const ARTIFACTS_TAB_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "pulp_created", direction: "desc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({ sha256: z.string() }),
    defaultValue: { sha256: "" },
  }),
  // Its own piece, so "Clear all filters" keeps the switch.
  orphaned: definePersistentState({
    key: "orphaned",
    schema: z.object({ orphaned: z.stringbool() }),
    defaultValue: { orphaned: false },
  }),
});
