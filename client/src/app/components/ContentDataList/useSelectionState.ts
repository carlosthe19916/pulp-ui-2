import { useState } from "react";

/**
 * Generic selected-set state (row selection, expansion, any multi-toggle), after
 * Konveyor's `useSelectionState`. Items compare with `isEqual` (referential by default).
 */
export interface IUseSelectionStateOptions<T> {
  items: T[];
  initialSelected?: T[];
  isEqual?: (a: T, b: T) => boolean;
}

export interface ISelectionState<T> {
  selectedItems: T[];
  isItemSelected: (item: T) => boolean;
  areAllSelected: boolean;
  /** Add or remove a subset from the selection. */
  selectItems: (params: { items: T[]; isSelecting: boolean }) => void;
  /** Toggle a single item's membership. */
  toggleItem: (item: T) => void;
  /** Replace the whole selection with exactly these items. */
  selectOnly: (items: T[]) => void;
  /** Select all current items, or clear the selection. */
  selectAll: (params?: { isSelecting?: boolean }) => void;
}

interface IDoSelectParams<T> {
  isEqual: (a: T, b: T) => boolean;
  fullSet: T[];
  selections: T[];
}

/** Narrow `selections` to the members actually present in `fullSet` (by `isEqual`). */
const doSelect = <T>({
  isEqual,
  fullSet,
  selections,
}: IDoSelectParams<T>): T[] =>
  selections.length === 0
    ? []
    : fullSet.filter((item) => selections.some((test) => isEqual(item, test)));

const referenceEquals = <T>(a: T, b: T) => a === b;

export const useSelectionState = <T>({
  items,
  initialSelected = [],
  isEqual = referenceEquals,
}: IUseSelectionStateOptions<T>): ISelectionState<T> => {
  const [selectedSet, setSelectedSet] = useState<T[]>(() =>
    doSelect({ isEqual, fullSet: items, selections: initialSelected }),
  );

  const isItemSelected = (item: T) => selectedSet.some((i) => isEqual(item, i));

  const selectItems = ({
    items: itemsSubset,
    isSelecting,
  }: {
    items: T[];
    isSelecting: boolean;
  }) => {
    setSelectedSet((prev) => {
      const kept = prev.filter(
        (selected) => !itemsSubset.some((item) => isEqual(selected, item)),
      );
      return isSelecting ? [...kept, ...itemsSubset] : kept;
    });
  };

  const toggleItem = (item: T) =>
    selectItems({ items: [item], isSelecting: !isItemSelected(item) });

  const selectOnly = (toSelect: T[]) =>
    setSelectedSet(doSelect({ isEqual, fullSet: items, selections: toSelect }));

  const selectAll = ({ isSelecting = true }: { isSelecting?: boolean } = {}) =>
    setSelectedSet(isSelecting ? items : []);

  const areAllSelected =
    items.length > 0 &&
    items.every((i) => selectedSet.some((si) => isEqual(si, i)));

  const selectedItems = items.filter((i) =>
    selectedSet.some((si) => isEqual(si, i)),
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
