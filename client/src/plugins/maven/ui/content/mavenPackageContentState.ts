/** What a Maven package's file list keeps: only the page. */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const MAVEN_PACKAGE_FILES_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
