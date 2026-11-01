/**
 * What the content guards list keeps (page, sort, filters). `ContentGuardList` reads each piece
 * with `usePersistentState`; its route passes `listSearch(CONTENT_GUARD_LIST_STATE)` for typed links.
 */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IContentGuardListParams } from "@app/queries/content-guards";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
  schemaFromGuard,
} from "@app/utils/listState";
import { getContentGuardFacts } from "@catalog";

export const SORTABLE_COLUMN_KEYS = [
  "name",
  "pulp_type",
  "pulp_created",
] as const satisfies readonly OrderingField<IContentGuardListParams>[];

type ContentGuardPulpType = NonNullable<IContentGuardListParams["pulp_type"]>;

// Every guard type the catalog declares is in Pulp's enum, so the guard can narrow to it.
const isContentGuardPulpType = (value: string): value is ContentGuardPulpType =>
  getContentGuardFacts().some((guard) => guard.pulpType === value);

export const CONTENT_GUARD_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      name: z.string(),
      pulp_type: z.array(schemaFromGuard(isContentGuardPulpType)),
    }),
    defaultValue: { name: "", pulp_type: [] },
  }),
});
