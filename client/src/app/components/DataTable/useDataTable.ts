import {
  tableFeatures,
  useTable,
  type ColumnDef,
  type ReactTable,
  type RowData,
} from "@tanstack/react-table";

/**
 * Minimal opt-in feature set for this app's tables. Pagination, filtering, and
 * sorting are all handled server-side (via the react-query hooks in
 * `queries/`), so no row-model features are registered — only TanStack Table's
 * always-on core row model is used, which renders exactly the rows the API
 * returned. Declared once at module scope as recommended by TanStack.
 */
const features = tableFeatures({});

type AppFeatures = typeof features;

/**
 * App-wide column definition type. Pages should import this instead of
 * `@tanstack/react-table`'s `ColumnDef` directly, so the underlying type
 * (including the registered feature set) lives in this single seam.
 */
export type AppColumnDef<TData extends RowData> = ColumnDef<AppFeatures, TData>;

/** The table instance returned by {@link useDataTable}. */
export type DataTableInstance<TData extends RowData> = ReactTable<
  AppFeatures,
  TData
>;

interface IUseDataTableOptions<TData extends RowData> {
  data: TData[];
  columns: AppColumnDef<TData>[];
}

/**
 * Thin wrapper around TanStack Table for this app's server-driven tables.
 * This hook is the single place that touches `@tanstack/react-table`'s table
 * factory.
 */
export function useDataTable<TData extends RowData>({
  data,
  columns,
}: IUseDataTableOptions<TData>): DataTableInstance<TData> {
  return useTable({ features, data, columns });
}
