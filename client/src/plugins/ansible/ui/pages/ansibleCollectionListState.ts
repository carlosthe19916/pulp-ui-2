/** What the Ansible collections list keeps (page, sort, filters); its plugin route has no `listSearch`. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  defineListState,
  defineSortState,
  PAGINATION_STATE,
} from "@app/utils/listState";

import type { IAnsibleCollectionListParams } from "../queries/ansible-collections";

export const SORTABLE_COLUMN_KEYS = [
  "namespace",
  "name",
] as const satisfies readonly OrderingField<IAnsibleCollectionListParams>[];

export const ANSIBLE_COLLECTION_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  sort: defineSortState({
    columnKeys: SORTABLE_COLUMN_KEYS,
    defaultValue: { sortBy: "namespace", direction: "asc" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      namespace: z.string(),
      name: z.string(),
      tags: z.string(),
    }),
    defaultValue: { namespace: "", name: "", tags: "" },
  }),
});
