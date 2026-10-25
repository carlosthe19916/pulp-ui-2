import { useId } from "react";

import {
  BulkSelect,
  BulkSelectValue,
} from "@patternfly/react-component-groups/dist/dynamic/BulkSelect";
import type { DataViewTrObject } from "@patternfly/react-data-view";

interface IPageBulkSelectProps<T extends DataViewTrObject> {
  /** The selectable rows on the current page (disabled rows left out). */
  pageRows: T[];
  selection: {
    selected: T[];
    onSelect: (isSelecting: boolean, items?: T[] | T) => void;
    isSelected: (item: T) => boolean;
    setSelected: (items: T[]) => void;
  };
}

/**
 * The bulk selector of a paginated selection table: Select none / Select page (no
 * Select all), with the selected count across pages.
 */
export const PageBulkSelect = <T extends DataViewTrObject>({
  pageRows,
  selection,
}: IPageBulkSelectProps<T>) => {
  const checkboxId = useId();
  const selectedOnPage = pageRows.filter((row) =>
    selection.isSelected(row),
  ).length;

  return (
    <BulkSelect
      isDataPaginated
      canSelectAll={false}
      pageCount={pageRows.length}
      selectedCount={selection.selected.length}
      pageSelected={pageRows.length > 0 && selectedOnPage === pageRows.length}
      pagePartiallySelected={
        selectedOnPage > 0 && selectedOnPage < pageRows.length
      }
      menuToggleCheckboxProps={{ id: checkboxId }}
      onSelect={(value) => {
        if (value === BulkSelectValue.none) selection.setSelected([]);
        if (value === BulkSelectValue.page) selection.onSelect(true, pageRows);
        if (value === BulkSelectValue.nonePage) {
          selection.onSelect(false, pageRows);
        }
      }}
    />
  );
};
