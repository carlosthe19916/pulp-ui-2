import { useState } from "react";

/** A selected content unit: its href plus what a confirmation shows for it. */
export interface IContentUnitRef {
  href: string;
  label: string;
  pulpType?: string;
}

/** Content changes a list offers; absent when the list is read-only. */
export interface IContentWrites {
  /** Asks to remove the selected units (the page confirms and runs it). */
  onRemove: (units: IContentUnitRef[]) => void;
  /** A task runs on the repository: selection and Remove are disabled. */
  isLocked: boolean;
  /** Lock and permission props every write action (Remove, Untag) spreads. */
  actionProps: { isAriaDisabled?: boolean; tooltipProps?: { content: string } };
}

/**
 * Checkbox selection of content units, kept across pages and filters of one view.
 * Keyed by href; the caller clears it when the view changes.
 */
export const useContentUnitSelection = () => {
  const [selected, setSelected] = useState<Map<string, IContentUnitRef>>(
    () => new Map(),
  );

  const setUnits = ({
    units,
    isSelecting,
  }: {
    units: IContentUnitRef[];
    isSelecting: boolean;
  }) =>
    setSelected((current) => {
      const next = new Map(current);
      for (const unit of units) {
        if (isSelecting) next.set(unit.href, unit);
        else next.delete(unit.href);
      }
      return next;
    });

  return {
    selected: [...selected.values()],
    isSelected: (href: string) => selected.has(href),
    setUnits,
    clear: () => setSelected(new Map()),
  };
};

export type IContentUnitSelection = ReturnType<typeof useContentUnitSelection>;

interface IDataViewSelectionOptions {
  selection: IContentUnitSelection;
  units: IContentUnitRef[];
  isSelectDisabled?: (href: string) => boolean;
}

/**
 * The DataView `selection` for a page of units: table rows carry the unit href as
 * their id; a row checkbox passes that row, the header checkbox an array.
 */
export const dataViewSelection = ({
  selection,
  units,
  isSelectDisabled,
}: IDataViewSelectionOptions) => ({
  onSelect: (
    isSelecting: boolean,
    items?: { id?: unknown } | { id?: unknown }[],
  ) => {
    const ids = new Set(
      (Array.isArray(items) ? items : [items]).map((item) => item?.id),
    );
    selection.setUnits({
      units: units.filter((unit) => ids.has(unit.href)),
      isSelecting,
    });
  },
  isSelected: (item: { id?: unknown }) =>
    typeof item.id === "string" && selection.isSelected(item.id),
  isSelectDisabled: (item: { id?: unknown }) =>
    typeof item.id === "string" && !!isSelectDisabled?.(item.id),
});
