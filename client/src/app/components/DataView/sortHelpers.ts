import type React from "react";

import type { ISortBy, ThProps } from "@patternfly/react-table";

/** `onSort` handler shape returned by react-data-view's `useDataViewSort`. */
type DataViewOnSort = (
  event: React.MouseEvent | React.KeyboardEvent | MouseEvent | undefined,
  sortBy: string,
  direction: ISortBy["direction"],
) => void;

interface IBuildThSortArgs<K extends string> {
  /** All column keys in render order (key ↔ index bridge). */
  columnKeys: readonly K[];
  /** Key of the column these `Th` sort props are for. */
  columnKey: K;
  /** Currently sorted column key (from `useDataViewSort`). */
  sortBy: string | undefined;
  /** Current sort direction (from `useDataViewSort`). */
  direction: ISortBy["direction"];
  /** `useDataViewSort`'s string-keyed `onSort`. */
  onSort: DataViewOnSort;
}

/**
 * Build PatternFly `Th` sort props for one column, bridging react-data-view's
 * **string-keyed** sort state to PatternFly's **index-based** `ThSortType`.
 * Callers pass a column key; the index PatternFly needs is derived from
 * `columnKeys`, and the clicked column is reported back to `onSort` by key.
 */
/**
 * Turn react-data-view's string-keyed sort state into a Pulp `ordering` query
 * param (`"name"` / `"-name"`). Returns `undefined` when nothing is sorted, so
 * server-paginated lists can pass it straight to their list query. Callers cast
 * the result to their domain's `ordering` enum type.
 */
export const toOrderingParam = (
  sortBy: string | undefined,
  direction: ISortBy["direction"],
): string | undefined =>
  sortBy ? (direction === "desc" ? `-${sortBy}` : sortBy) : undefined;

export const buildThSort = <K extends string>({
  columnKeys,
  columnKey,
  sortBy,
  direction,
  onSort,
}: IBuildThSortArgs<K>): ThProps["sort"] => {
  const columnIndex = columnKeys.indexOf(columnKey);
  return {
    sortBy: {
      index: sortBy ? columnKeys.indexOf(sortBy as K) : undefined,
      direction: sortBy ? direction : undefined,
    },
    onSort: (event, _columnIndex, newDirection) =>
      onSort(event, columnKey, newDirection),
    columnIndex,
  };
};
