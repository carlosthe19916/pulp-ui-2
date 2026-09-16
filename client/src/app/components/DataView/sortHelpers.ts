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
  columnKey: K;
  sortBy: string | undefined;
  direction: ISortBy["direction"];
  onSort: DataViewOnSort;
}

/**
 * Turn react-data-view's string-keyed sort state into a Pulp `ordering` param
 * (`"name"` / `"-name"`), or `undefined` when nothing is sorted. Callers cast to
 * their domain's `ordering` enum type.
 */
export const toOrderingParam = (
  sortBy: string | undefined,
  direction: ISortBy["direction"],
): string | undefined =>
  sortBy ? (direction === "desc" ? `-${sortBy}` : sortBy) : undefined;

/**
 * Build PatternFly `Th` sort props for one column, bridging react-data-view's
 * string-keyed sort state to PatternFly's index-based `ThSortType`.
 */
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
