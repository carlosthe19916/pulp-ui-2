/**
 * What a collection's versions list keeps (page). `CollectionVersions` keeps it in component
 * state, since several expanded rows can be open at once.
 */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const COLLECTION_VERSIONS_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
