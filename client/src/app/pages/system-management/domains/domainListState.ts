/** What the Domains list keeps (page, sort, filters); its route types links with `listSearch`. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IDomainListParams } from "@app/queries/domains";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "name",
  "description",
  "storage_class",
  "pulp_created",
] as const satisfies readonly OrderingField<IDomainListParams>[];

export const DOMAIN_LIST_STATE = defineListState({
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
