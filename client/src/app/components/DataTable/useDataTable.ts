import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

/**
 * App-wide column definition type. Pages should import this instead of
 * `@tanstack/react-table`'s `ColumnDef` directly, so the underlying type can
 * evolve (e.g. a TanStack Table major upgrade) from this single seam.
 */
export type AppColumnDef<TData> = ColumnDef<TData>;

interface IUseDataTableOptions<TData> {
  data: TData[];
  columns: AppColumnDef<TData>[];
}

/**
 * Thin wrapper around TanStack Table for this app's server-driven tables:
 * pagination, filtering, and sorting are all handled server-side (via the
 * react-query hooks in `queries/`), so only the core row model is needed and
 * pagination is always manual. This hook is the single place that touches
 * `@tanstack/react-table`'s table factory.
 */
export function useDataTable<TData>({
  data,
  columns,
}: IUseDataTableOptions<TData>) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });
}
