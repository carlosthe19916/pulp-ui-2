/** What the Importers tab keeps: only the page; the list has a fixed ordering and no filters. */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const IMPORTERS_TAB_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
