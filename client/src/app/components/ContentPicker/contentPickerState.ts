/** What the content picker keeps in the list-state hook: only the page. */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const CONTENT_PICKER_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
