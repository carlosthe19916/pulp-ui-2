/** What the Content list keeps (page, filters); its route types links with `listSearch`. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import { isContentPulpType } from "@app/utils/contentPulpType";
import {
  defineListState,
  PAGINATION_STATE,
  schemaFromGuard,
} from "@app/utils/listState";

// The aggregate content endpoint only orders by `pk`, so this list has no sort.
export const CONTENT_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  filters: definePersistentState({
    key: "filters",
    // repo_version and version_diff hold the encoded values of their composite filters.
    schema: z.object({
      pulp_type: z.array(schemaFromGuard(isContentPulpType)),
      pulp_label_select: z.string(),
      orphaned_for: z.string(),
      repo_version: z.string(),
      version_diff: z.string(),
    }),
    defaultValue: {
      pulp_type: [],
      pulp_label_select: "",
      orphaned_for: "",
      repo_version: "",
      version_diff: "",
    },
  }),
});
