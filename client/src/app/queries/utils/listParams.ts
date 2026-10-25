/** Query params for a generated `*ListData` type, sourced from the spec so every list query stays in sync on `npm run generate`. */
type QueryOf<TData extends { query?: object }> = NonNullable<TData["query"]>;

/** Element type of a query's `ordering` array, or `never` when it has none. */
type SingleOrdering<TQuery> = TQuery extends { ordering?: infer O }
  ? NonNullable<O> extends readonly (infer E)[]
    ? E
    : never
  : never;

/**
 * Params for a paged list query. `ordering` is one value (the query fn re-wraps it);
 * `limit` is required so no silent default truncates results.
 */
export type ListParams<TData extends { query?: object }> = Omit<
  QueryOf<TData>,
  "ordering" | "limit"
> & {
  ordering?: SingleOrdering<QueryOf<TData>>;
  limit: number;
};

/**
 * Like `ListParams` but keeps the spec's `ordering` array for multi-field sorts (the
 * axios serializer comma-joins it).
 */
export type MultiOrderListParams<TData extends { query?: object }> = Omit<
  QueryOf<TData>,
  "limit"
> & {
  limit: number;
};

/** Distributes over an ordering union, dropping the "-" descending variants. */
type AscendingOrdering<O extends string> = O extends `-${string}` ? never : O;

/** Ascending ordering field names for a list-params type (e.g. "name" | "description" | …). */
export type OrderingField<P extends { ordering?: string }> = AscendingOrdering<
  NonNullable<P["ordering"]>
>;
