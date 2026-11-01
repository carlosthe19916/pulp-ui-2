/**
 * What the Container namespaces list keeps (page, sort, filters). Its route is a plugin page, so
 * it isn't declared there; `ContainerNamespaceList` reads each piece with `usePersistentState`.
 */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

import type { IContainerNamespaceListParams } from "../queries/container-namespaces";

export const SORTABLE_COLUMN_KEYS = [
  "name",
  "pulp_created",
] as const satisfies readonly OrderingField<IContainerNamespaceListParams>[];

export const CONTAINER_NAMESPACE_LIST_STATE = defineListState({
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
