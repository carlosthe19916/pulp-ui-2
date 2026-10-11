import { useDataViewSort } from "@patternfly/react-data-view";
import type { ISortBy } from "@patternfly/react-table";

import { buildThSort, toOrderingParam } from "./sortHelpers";

interface IUseColumnSortArgs<K extends string> {
  /** Sortable column keys; each key's array index is its logical sort id. */
  columnKeys: readonly K[];
  /** Default sort; `sortBy` must be a member of `columnKeys`. */
  initialSort: { sortBy: K; direction: NonNullable<ISortBy["direction"]> };
  /** Called after any sort change — e.g. reset pagination to page 1. */
  onSortChange?: () => void;
}

/**
 * Typed wrapper around react-data-view's `useDataViewSort` (which is not generic
 * and works in plain `string`s). Binding the sortable `columnKeys` constrains
 * `initialSort.sortBy` to a valid key and yields a cast-free `ordering` query
 * param plus a per-column `sortProps` builder. The single `string`→key assertion
 * is contained here and validated against `columnKeys`, so a stale or
 * URL-supplied value self-heals to "unsorted" instead of reaching the API.
 *
 * @param args.columnKeys - Sortable keys; each key's index is its sort id.
 * @param args.initialSort - Default `{ sortBy, direction }`.
 * @param args.onSortChange - Run after each sort change (e.g. reset the page).
 * @returns `{ sortBy, direction, onSort, ordering, sortProps }` — `ordering` for
 *   the list query and `sortProps(key)` for each sortable `<Th>`.
 */
export const useColumnSort = <K extends string>({
  columnKeys,
  initialSort,
  onSortChange,
}: IUseColumnSortArgs<K>) => {
  const { sortBy, direction, onSort } = useDataViewSort({ initialSort });
  // useDataViewSort is not generic and hands back `string`; re-narrow to our
  // key union once, here at the library boundary, so consumers stay cast-free.
  // Validate against columnKeys rather than blindly asserting, so a stale or
  // URL-supplied sortBy self-heals to "unsorted" instead of reaching the API.
  const typedSortBy =
    sortBy !== undefined && (columnKeys as readonly string[]).includes(sortBy)
      ? (sortBy as K)
      : undefined;
  const ordering = toOrderingParam(typedSortBy, direction);
  const sortProps = (columnKey: K) =>
    buildThSort({
      columnKeys,
      columnKey,
      sortBy,
      direction,
      onSort: (event, sortedKey, newDirection) => {
        onSort(event, sortedKey, newDirection);
        onSortChange?.();
      },
    });
  return { sortBy: typedSortBy, direction, onSort, ordering, sortProps };
};
