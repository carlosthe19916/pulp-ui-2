/** What a row's task list (`ResourceTaskTable`) keeps: only the page, newest tasks first. */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const RESOURCE_TASK_TABLE_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
