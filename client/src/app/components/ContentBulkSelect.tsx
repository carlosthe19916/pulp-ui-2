import type React from "react";
import { useId } from "react";

import {
  BulkSelect,
  BulkSelectValue,
} from "@patternfly/react-component-groups/dist/dynamic/BulkSelect";

import { GatedButton } from "@app/components/GatedButton";
import type {
  IContentUnitRef,
  IContentUnitSelection,
  IContentWrites,
} from "@app/hooks/useContentUnitSelection";
import { REPOSITORY_LOCKED_PROPS } from "@app/hooks/useRepositoryActivity";

interface IContentBulkSelectProps {
  /** The units on the current page. */
  pageUnits: IContentUnitRef[];
  selection: IContentUnitSelection;
  isDisabled?: boolean;
}

/**
 * The PatternFly bulk selector for a paginated content list: Select none / Select
 * page (no Select all), with the selected count across pages.
 */
export const ContentBulkSelect: React.FC<IContentBulkSelectProps> = ({
  pageUnits,
  selection,
  isDisabled,
}) => {
  const checkboxId = useId();
  const selectedOnPage = pageUnits.filter((unit) =>
    selection.isSelected(unit.href),
  ).length;

  return (
    <BulkSelect
      isDataPaginated
      canSelectAll={false}
      pageCount={pageUnits.length}
      selectedCount={selection.selected.length}
      pageSelected={pageUnits.length > 0 && selectedOnPage === pageUnits.length}
      pagePartiallySelected={
        selectedOnPage > 0 && selectedOnPage < pageUnits.length
      }
      menuToggleProps={{ isDisabled }}
      menuToggleCheckboxProps={{ id: checkboxId, isDisabled }}
      onSelect={(value) => {
        if (value === BulkSelectValue.none) selection.clear();
        if (value === BulkSelectValue.page) {
          selection.setUnits({ units: pageUnits, isSelecting: true });
        }
        if (value === BulkSelectValue.nonePage) {
          selection.setUnits({ units: pageUnits, isSelecting: false });
        }
      }}
    />
  );
};

interface IRemoveSelectedButtonProps {
  selection: IContentUnitSelection;
  writes: IContentWrites;
}

/** The toolbar's Remove button for the selected units. */
export const RemoveSelectedButton: React.FC<IRemoveSelectedButtonProps> = ({
  selection,
  writes,
}) => (
  <GatedButton
    variant="secondary"
    // Locked keeps the reason tooltip; a plain-disabled button can't show it.
    isDisabled={!writes.isLocked && selection.selected.length === 0}
    onClick={() => writes.onRemove(selection.selected)}
    {...(writes.isLocked ? REPOSITORY_LOCKED_PROPS : {})}
  >
    Remove
  </GatedButton>
);
