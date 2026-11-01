/** What the Uploads tab keeps (page, sort); the list has no filters. */
import type { IUploadListParams } from "@app/queries/uploads";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

export const SORTABLE_COLUMN_KEYS = [
  "size",
  "pulp_created",
] as const satisfies readonly OrderingField<IUploadListParams>[];

export const UPLOADS_TAB_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "pulp_created", direction: "desc" },
  }),
});
