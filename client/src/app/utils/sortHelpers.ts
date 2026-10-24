import type React from "react";

import type { ISortBy, ThProps } from "@patternfly/react-table";

/** `onSort` handler shape returned by react-data-view's `useDataViewSort`. */
type DataViewOnSort = (
  event: React.MouseEvent | React.KeyboardEvent | MouseEvent | undefined,
  sortBy: string,
  direction: ISortBy["direction"],
) => void;

interface IBuildThSortOptions<K extends string> {
  /** Sortable column keys; each key's array index is its logical sort id. */
  columnKeys: readonly K[];
  columnKey: K;
  sortBy: string | undefined;
  direction: ISortBy["direction"];
  onSort: DataViewOnSort;
}

/**
 * Convert react-data-view sort state to a Pulp `ordering` param (`"name"` / `"-name"`),
 * typed as the exact key union.
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
 * PatternFly `Th` `sort` props for one column. Indices derive from `columnKeys`, so the
 * active sort holds regardless of column position.
 */
export const buildThSort = <K extends string>({
  columnKeys,
  columnKey,
  sortBy,
  direction,
  onSort,
}: IBuildThSortOptions<K>): ThProps["sort"] => {
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
