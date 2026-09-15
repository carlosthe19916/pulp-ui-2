import type React from "react";

import type { ISortBy, ThProps } from "@patternfly/react-table";

/** `onSort` handler shape returned by react-data-view's `useDataViewSort`. */
type DataViewOnSort = (
  event: React.MouseEvent | React.KeyboardEvent | MouseEvent | undefined,
  sortBy: string,
  direction: ISortBy["direction"],
) => void;

interface IBuildThSortArgs {
  /** All column keys in render order (index ↔ key bridge). */
  columnKeys: string[];
  /** Index of the column these `Th` sort props are for. */
  columnIndex: number;
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
 * PatternFly reports the clicked column by index, so we map that index back to
 * this column's key before handing it to the hook's `onSort`.
 */
export function buildThSort({
  columnKeys,
  columnIndex,
  sortBy,
  direction,
  onSort,
}: IBuildThSortArgs): ThProps["sort"] {
  const columnKey = columnKeys[columnIndex];
  return {
    sortBy: {
      index: sortBy ? columnKeys.indexOf(sortBy) : undefined,
      direction: sortBy ? direction : undefined,
    },
    onSort: (event, _columnIndex, newDirection) =>
      onSort(event, columnKey, newDirection),
    columnIndex,
  };
}
