/** What the Repositories list keeps (page, sort, filters); its route types links with `listSearch`. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IRepositoryListParams } from "@app/queries/repositories";
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
  "description",
] as const satisfies readonly OrderingField<IRepositoryListParams>[];

type RepositoryPulpType = NonNullable<IRepositoryListParams["pulp_type"]>;

// Every repository type the catalog declares is in Pulp's enum, so the guard can narrow to it.
const isRepositoryPulpType = (value: string): value is RepositoryPulpType =>
  !!getPulpType(value)?.entities.repository;

export const REPOSITORY_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      name: z.string(),
      pulp_type: z.array(schemaFromGuard(isRepositoryPulpType)),
    }),
    defaultValue: { name: "", pulp_type: [] },
  }),
});
