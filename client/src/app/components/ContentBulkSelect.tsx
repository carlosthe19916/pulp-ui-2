import type React from "react";
import { useId } from "react";

import { Button } from "@patternfly/react-core";
import {
  BulkSelect,
  BulkSelectValue,
} from "@patternfly/react-component-groups/dist/dynamic/BulkSelect";

import type {
  IContentUnitRef,
  IContentUnitSelection,
  IContentWrites,
} from "@app/hooks/useContentUnitSelection";

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

/** The toolbar's Remove button for the selected units. */
export const RemoveSelectedButton: React.FC<{
  selection: IContentUnitSelection;
  writes: IContentWrites;
}> = ({ selection, writes }) => (
  <Button
    variant="secondary"
    isDisabled={writes.isLocked || selection.selected.length === 0}
    onClick={() => writes.onRemove(selection.selected)}
  >
    Remove
  </Button>
);
