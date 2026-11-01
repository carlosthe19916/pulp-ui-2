/** What a release's component or architecture list keeps: only the page. */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const RELEASE_VALUES_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
