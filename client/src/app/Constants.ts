import ENV from "./env";

export const RENDER_DATE_FORMAT = "MMM DD, YYYY";
export const RENDER_DATETIME_FORMAT = "MMM DD, YYYY | HH:mm:ss";

export const DEFAULT_REFETCH_INTERVAL = 5000;

export const PULP_DOMAIN = ENV.PULP_DOMAIN ?? "default";
