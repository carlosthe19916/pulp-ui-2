/** What the Remotes list keeps (page, sort, filters); its route types links with `listSearch`. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { IRemoteListParams } from "@app/queries/remotes";
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
  "url",
  "policy",
] as const satisfies readonly OrderingField<IRemoteListParams>[];

type RemotePulpType = NonNullable<IRemoteListParams["pulp_type"]>;

// Every remote type the catalog declares is in Pulp's enum, so the guard can narrow to it.
const isRemotePulpType = (value: string): value is RemotePulpType =>
  !!getPulpType(value)?.entities.remote;

export const REMOTE_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "name", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      name: z.string(),
      pulp_type: z.array(schemaFromGuard(isRemotePulpType)),
    }),
    defaultValue: { name: "", pulp_type: [] },
  }),
});
