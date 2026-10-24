import type React from "react";

import type { ISortBy, ThProps } from "@patternfly/react-table";

/** `onSort` handler shape returned by react-data-view's `useDataViewSort`. */
type DataViewOnSort = (
  event: React.MouseEvent | React.KeyboardEvent | MouseEvent | undefined,
  sortBy: string,
  direction: ISortBy["direction"],
) => void;

interface IBuildThSortArgs<K extends string> {
  /** Sortable column keys; each key's array index is its logical sort id. */
  columnKeys: readonly K[];
  columnKey: K;
  sortBy: string | undefined;
  direction: ISortBy["direction"];
  onSort: DataViewOnSort;
}

/**
 * Convert react-data-view's string sort state into a Pulp `ordering` query param
 * (`"name"` / `"-name"`). Generic over the key `K`, so the result type is the
 * exact ascending/descending union — no cast needed when `sortBy` is typed.
 *
 * @param args.sortBy - Active sort key, or `undefined` when unsorted.
 * @param args.direction - `"desc"` prefixes the key with `-`; otherwise ascending.
 * @returns The `ordering` value, or `undefined` when `sortBy` is unset.
 */
export const toOrderingParam = <K extends string>({
  sortBy,
  direction,
}: {
  sortBy: K | undefined;
  direction: ISortBy["direction"];
}): K | `-${K}` | undefined =>
  sortBy ? (direction === "desc" ? `-${sortBy}` : sortBy) : undefined;

/**
 * Build PatternFly `Th` `sort` props for one column, bridging react-data-view's
 * string-keyed sort state to PatternFly's index-based `ThSortType`. Both indices
 * derive from `columnKeys`, so the active-sort state stays correct regardless of
 * the column's visual position.
 *
 * @param args.columnKeys - All sortable keys; a key's index is its sort id.
 * @param args.columnKey - Key of the column these props belong to.
 * @param args.sortBy - Active sort key, or `undefined` when unsorted.
 * @param args.direction - Active sort direction.
 * @param args.onSort - Called with the column's key and the new direction.
 * @returns The `sort` prop for this column's `<Th>`.
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
