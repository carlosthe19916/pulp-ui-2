import type React from "react";

import type { ISortBy, ThProps } from "@patternfly/react-table";

/** `onSort` handler shape of react-data-view's `useDataViewSort`, narrowed to the column keys. */
type ColumnOnSort<K extends string> = (
  event: React.MouseEvent | React.KeyboardEvent | MouseEvent | undefined,
  sortBy: K,
  direction: ISortBy["direction"],
) => void;

interface IBuildThSortOptions<K extends string> {
  /** Sortable column keys; each key's array index is its logical sort id. */
  columnKeys: readonly K[];
  columnKey: K;
  sortBy: string | undefined;
  direction: ISortBy["direction"];
  onSort: ColumnOnSort<K>;
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

/** Sort state as `usePersistentState` keeps it (`defineSortState`). */
export interface IColumnSortState<K extends string> {
  sortBy: K;
  direction: "asc" | "desc";
}

interface IColumnSortOptions<K extends string> {
  /** Sortable column keys; each key's array index is its logical sort id. */
  columnKeys: readonly K[];
  sort: IColumnSortState<K>;
  onSort: (sort: IColumnSortState<K>) => void;
}

/** A Pulp `ordering` param and a `sortProps(key)` builder for each sortable `<Th>`, from sort state. */
export const columnSort = <K extends string>({
  columnKeys,
  sort,
  onSort,
}: IColumnSortOptions<K>) => ({
  ordering: toOrderingParam(sort),
  sortProps: (columnKey: K) =>
    buildThSort({
      columnKeys,
      columnKey,
      sortBy: sort.sortBy,
      direction: sort.direction,
      onSort: (_event, sortBy, direction) =>
        onSort({ sortBy, direction: direction === "desc" ? "desc" : "asc" }),
    }),
});
