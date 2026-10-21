import { useCallback, useMemo, useState } from "react";

/**
 * Generic "set of selected items" state, decoupled from any one widget — use it for row
 * selection, row expansion, or any multi-toggle over a list. Adapted from the Konveyor/Tackle
 * `useSelectionState` pattern (also used in trustify-ui). Items are compared with `isEqual`
 * (referential by default), so it works with object rows or plain id strings.
 */
export interface ISelectionStateArgs<T> {
  items: T[];
  initialSelected?: T[];
  isEqual?: (a: T, b: T) => boolean;
}

export interface ISelectionState<T> {
  selectedItems: T[];
  isItemSelected: (item: T) => boolean;
  areAllSelected: boolean;
  /** Add or remove a subset from the selection. */
  selectItems: (items: T[], isSelected: boolean) => void;
  /** Toggle a single item's membership. */
  toggleItem: (item: T) => void;
  /** Replace the whole selection with exactly these items. */
  selectOnly: (items: T[]) => void;
  /** Select all current items, or clear the selection. */
  selectAll: (isSelected: boolean) => void;
}

/** Narrow `selections` to the members actually present in `fullSet` (by `isEqual`). */
const doSelect = <T>({
  isEqual,
  fullSet,
  selections,
}: {
  isEqual: (a: T, b: T) => boolean;
  fullSet: T[];
  selections: T[];
}): T[] =>
  selections.length === 0
    ? []
    : fullSet.filter((item) => selections.some((test) => isEqual(item, test)));

export const useSelectionState = <T>({
  items,
  initialSelected = [],
  isEqual = (a, b) => a === b,
}: ISelectionStateArgs<T>): ISelectionState<T> => {
  const [selectedSet, setSelectedSet] = useState<T[]>(() =>
    doSelect({ isEqual, fullSet: items, selections: initialSelected }),
  );

  const isItemSelected = useCallback(
    (item: T) => selectedSet.some((i) => isEqual(item, i)),
    [isEqual, selectedSet],
  );

  const selectItems = useCallback(
    (itemsSubset: T[], isSelecting: boolean) => {
      setSelectedSet((prev) => {
        const kept = prev.filter(
          (selected) => !itemsSubset.some((item) => isEqual(selected, item)),
        );
        return isSelecting ? [...kept, ...itemsSubset] : kept;
      });
    },
    [isEqual],
  );

  const toggleItem = useCallback(
    (item: T) => selectItems([item], !isItemSelected(item)),
    [selectItems, isItemSelected],
  );

  const selectOnly = useCallback(
    (toSelect: T[]) =>
      setSelectedSet(
        doSelect({ isEqual, fullSet: items, selections: toSelect }),
      ),
    [isEqual, items],
  );

  const selectAll = useCallback(
    (isSelecting = true) => setSelectedSet(isSelecting ? items : []),
    [items],
  );

  const areAllSelected = useMemo(
    () =>
      items.length > 0 &&
      items.every((i) => selectedSet.some((si) => isEqual(si, i))),
    [selectedSet, items, isEqual],
  );

  const selectedItems = useMemo(
    () => items.filter((i) => selectedSet.some((si) => isEqual(si, i))),
    [items, selectedSet, isEqual],
  );

  return {
    selectedItems,
    isItemSelected,
    areAllSelected,
    selectItems,
    toggleItem,
    selectOnly,
    selectAll,
  };
};
