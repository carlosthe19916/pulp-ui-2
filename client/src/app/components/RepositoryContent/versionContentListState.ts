/**
 * What a version's content list keeps (page, bucket, filters). `VersionContentList` reads each
 * piece with `usePersistentState`; the screen scopes it (`all.page` next to Browse sections).
 */
import { z } from "zod";

import type { ContentSummaryResponse } from "@app/client";
import { definePersistentState } from "@app/hooks/usePersistentState";
import { isContentPulpType } from "@app/utils/contentPulpType";
import {
  defineListState,
  PAGINATION_STATE,
  schemaFromGuard,
} from "@app/utils/listState";

export const BUCKET_KEYS = [
  "present",
  "added",
  "removed",
] as const satisfies readonly (keyof ContentSummaryResponse)[];

export const VERSION_CONTENT_LIST_STATE = defineListState({
  pagination: PAGINATION_STATE,
  bucket: definePersistentState({
    key: "bucket",
    schema: z.object({ bucket: z.enum(BUCKET_KEYS) }),
    defaultValue: { bucket: "present" },
  }),
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      pulp_type: z.array(schemaFromGuard(isContentPulpType)),
      pulp_label_select: z.string(),
    }),
    defaultValue: { pulp_type: [], pulp_label_select: "" },
  }),
});
