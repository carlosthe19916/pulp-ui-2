export const RENDER_DATE_FORMAT = "MMM DD, YYYY";
export const RENDER_DATETIME_FORMAT = "MMM DD, YYYY | HH:mm:ss";

export const DEFAULT_REFETCH_INTERVAL = 5000;

/**
 * Poll interval for a freshly dispatched task the user is actively waiting on (a content
 * change, a pending create). Tighter than DEFAULT_REFETCH_INTERVAL so the outcome toast
 * appears promptly instead of up to a full 5s after the task finishes.
 */
export const WATCHED_TASK_REFETCH_INTERVAL = 1000;

/** Pulp API domain path segment (stock Pulp default domain). */
export const DEFAULT_PULP_DOMAIN = "default";

/** Page size for typeahead/dropdown pickers (one page per search term). */
export const DROPDOWN_PAGE_SIZE = 10;
