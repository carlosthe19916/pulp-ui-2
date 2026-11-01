/** What the dashboard's Workers card keeps: only the page of online workers. */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const WORKERS_CARD_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
