/** What an exporter's or importer's runs (an expanded row) keep: only the page. */
import { defineListState, PAGINATION_STATE } from "@app/utils/listState";

export const RUNS_STATE = defineListState({
  pagination: PAGINATION_STATE,
});
