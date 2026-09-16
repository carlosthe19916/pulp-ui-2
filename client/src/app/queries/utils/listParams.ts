/** Query params for a generated `*ListData` type, sourced from the spec so every list query stays in sync on `npm run generate`. */
type QueryOf<TData extends { query?: unknown }> = NonNullable<TData["query"]>;

/** Element type of a query's `ordering` array, or `never` when it has none. */
type SingleOrdering<TQuery> = TQuery extends { ordering?: infer O }
  ? NonNullable<O> extends readonly (infer E)[]
    ? E
    : never
  : never;

/**
 * Params for a paged list query. `ordering` is narrowed to a single value
 * (data-view sorts one column; the query fn re-wraps to the spec's array form).
 * `limit` is required so no silent default caps results and truncates counts.
 */
export type ListParams<TData extends { query?: unknown }> = Omit<
  QueryOf<TData>,
  "ordering" | "limit"
> & {
  ordering?: SingleOrdering<QueryOf<TData>>;
  limit: number;
};

/** Params for a fetch-all query: `limit`/`offset` are managed by the paging loop, only filtering/ordering remain. */
export type AllListParams<TData extends { query?: unknown }> = Omit<
  ListParams<TData>,
  "limit" | "offset"
>;
