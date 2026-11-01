/** What the Distributions list keeps (page, sort, filters); its route types links with `listSearch`. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IDistributionListParams } from "@app/queries/distributions";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
  schemaFromGuard,
} from "@app/utils/listState";
import { getPulpType } from "@catalog";

export const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<IDistributionListParams>[];

type DistributionPulpType = NonNullable<IDistributionListParams["pulp_type"]>;

// Every distribution type the catalog declares is in Pulp's enum, so the guard can narrow to it.
const isDistributionPulpType = (value: string): value is DistributionPulpType =>
  !!getPulpType(value)?.entities.distribution;

export const DISTRIBUTION_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      name: z.string(),
      pulp_type: z.array(schemaFromGuard(isDistributionPulpType)),
    }),
    defaultValue: { name: "", pulp_type: [] },
  }),
});
