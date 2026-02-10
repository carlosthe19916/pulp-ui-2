import ENV from "./env";

export const FILTER_TEXT_CATEGORY_KEY = "";

export const RENDER_DATE_FORMAT = "MMM DD, YYYY";
export const RENDER_DATETIME_FORMAT = "MMM DD, YYYY | HH:mm:ss";
export const FILTER_DATE_FORMAT = "YYYY-MM-DD";

export const DEFAULT_REFETCH_INTERVAL = 5000;

export const PULP_DOMAIN = ENV.PULP_DOMAIN ?? "default";

export const TablePersistenceKeyPrefixes = {
  python_wheels: "pw",
};

export const uploadLimit = "500m";

/**
 * The name of the client generated id field inserted in a object marked with mixin type
 * `WithUiId`.
 */
export const UI_UNIQUE_ID = "_ui_unique_id";
