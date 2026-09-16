/**
 * All query params for a generated `*ListData` type, but with `ordering`
 * narrowed to a single value. The generated spec types `ordering` as an array
 * (multiple sort keys), but PatternFly's data-view sorts one column at a time,
 * so callers pass a single value. The list query fn re-wraps it into the spec's
 * array form (`ordering ? [ordering] : undefined`).
 *
 * Sourcing the rest of the params straight from `*ListData["query"]` keeps every
 * list query in sync with the OpenAPI spec on each `npm run generate`.
 */
type QueryOf<TData extends { query?: unknown }> = NonNullable<TData["query"]>;

/** Element type of a query's `ordering` array, or `never` when it has none. */
type SingleOrdering<TQuery> = TQuery extends { ordering?: infer O }
  ? NonNullable<O> extends readonly (infer E)[]
    ? E
    : never
  : never;

/**
 * Params for a paged list query. `limit` is **required**: every list query must
 * declare how many rows it wants (a page size, or `1` when only `count` is
 * needed). Leaving it implicit lets a silent default (client- or server-side)
 * cap the results and truncate counts — the bug this type prevents.
 */
export type ListParams<TData extends { query?: unknown }> = Omit<
  QueryOf<TData>,
  "ordering" | "limit"
> & {
  ordering?: SingleOrdering<QueryOf<TData>>;
  limit: number;
};

/**
 * Params for a fetch-all query. These walk every page internally, so `limit`
 * and `offset` are managed by the loop, not the caller — only the filtering /
 * ordering params remain.
 */
export type AllListParams<TData extends { query?: unknown }> = Omit<
  ListParams<TData>,
  "limit" | "offset"
>;
