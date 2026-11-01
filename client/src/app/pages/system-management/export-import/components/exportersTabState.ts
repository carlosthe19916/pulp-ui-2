/** What the Exporters tab keeps: the page and the exporter type shown. */
import { z } from "zod";

import { definePersistentState } from "@app/hooks/usePersistentState";
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

import { EXPORTER_TYPES } from "../utils/exporterTypes";

export const EXPORTERS_TAB_STATE = defineListState({
  pagination: PAGINATION_STATE,
  filters: definePersistentState({
    key: "filters",
    schema: z.object({
      type: z
        .string()
        .refine((value) =>
          EXPORTER_TYPES.some(({ apiPath }) => apiPath === value),
        ),
    }),
    defaultValue: { type: EXPORTER_TYPES[0].apiPath },
  }),
});
