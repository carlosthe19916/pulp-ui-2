/** What a group's Users tab keeps: only the page, since `groups_users_list` has no ordering or filters. */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const GROUP_USERS_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
