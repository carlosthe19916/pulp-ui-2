import type React from "react";
import { flexRender, type Table as TanStackTable } from "@tanstack/react-table";

import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import "./columnMeta";

interface IDataTableProps<TData> {
  /** The TanStack Table instance, typically from {@link useDataTable}. */
  table: TanStackTable<TData>;
  /** Accessible label for the table. */
  ariaLabel: string;
  /** PatternFly table variant. Defaults to `"compact"`. */
  variant?: "compact";
  /** Whether the table has no rows to display. */
  isEmpty: boolean;
  /**
   * Content shown (as a full-width row) when {@link isEmpty} is true. Pass a
   * plain string or a PatternFly `<EmptyState>`.
   */
  emptyStateContent: React.ReactNode;
}

/**
 * Renders a TanStack Table instance with PatternFly table primitives. Column
 * `meta` fields (see `columnMeta.ts`) drive per-cell PatternFly props such as
 * screen-reader headers and action-cell styling.
 */
export function DataTable<TData>({
  table,
  ariaLabel,
  variant = "compact",
  isEmpty,
  emptyStateContent,
}: IDataTableProps<TData>) {
  const columnCount = table.getVisibleLeafColumns().length;

  return (
    <Table aria-label={ariaLabel} variant={variant}>
      <Thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <Tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta;
              return (
                <Th key={header.id} screenReaderText={meta?.screenReaderHeader}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </Th>
              );
            })}
          </Tr>
        ))}
      </Thead>
      <Tbody>
        {isEmpty ? (
          <Tr>
            <Td colSpan={columnCount}>{emptyStateContent}</Td>
          </Tr>
        ) : (
          table.getRowModel().rows.map((row) => (
            <Tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta;
                return (
                  <Td
                    key={cell.id}
                    isActionCell={meta?.isActionCell}
                    hasAction={meta?.hasAction}
                    modifier={meta?.fitContent ? "fitContent" : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                );
              })}
            </Tr>
          ))
        )}
      </Tbody>
    </Table>
  );
}
