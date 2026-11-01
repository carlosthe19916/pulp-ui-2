/** What a collection's versions list keeps: only the page, in component state since several rows can be expanded. */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const COLLECTION_VERSIONS_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
