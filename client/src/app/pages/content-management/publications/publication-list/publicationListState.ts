/**
 * What the Publications list keeps (page, sort). `PublicationList` reads each piece with
 * `usePersistentState`; its route passes `listSearch(PUBLICATION_LIST_STATE)` for typed links.
 */
import type { IPublicationListParams } from "@app/queries/publications";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "pulp_created",
] as const satisfies readonly OrderingField<IPublicationListParams>[];

export const PUBLICATION_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "pulp_created", direction: "desc" },
  }),
});
