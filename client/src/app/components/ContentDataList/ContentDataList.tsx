import type React from "react";
import { useMemo } from "react";

import {
  Bullseye,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Skeleton,
} from "@patternfly/react-core";
import ErrorState from "@patternfly/react-component-groups/dist/dynamic/ErrorState";

import type { PageHeaderAction } from "@app/components/PageHeaderActionsMenu";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import type { IContentUnitSelection } from "@app/hooks/useContentUnitSelection";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";
import type { IContentUnit } from "@app/utils/contentUnit";
import { contentUnitRef } from "@app/utils/contentUnitRef";
import { isForbiddenError } from "@app/utils/isHttpError";

import { ContentListItem } from "./ContentListItem";
import { useSelectionState } from "./useSelectionState";

/** Stable keys for skeleton rows (max page size is 20), so no array index is used as a key. */
const SKELETON_KEYS = Array.from(
  { length: 20 },
  (_value, index) => `skeleton-${index}`,
);

interface IContentDataListProps {
  units: IContentUnit[];
  isLoading: boolean;
  error: DrfAxiosError | null;
  /** Filtered-aware empty state supplied by the page. */
  emptyState: React.ReactNode;
  loadingRows?: number;
  /** Clicking a row's label sets the label filter to its selector. */
  onLabelClick?: (selector: string) => void;
  /** Makes whole rows clickable instead of linking the PRN. */
  onSelect?: (href: string) => void;
  selectedHref?: string;
  /** Bulk-selection checkboxes; absent when the list isn't selectable. */
  bulk?: { selection: IContentUnitSelection; isDisabled: boolean };
  /** Row kebab actions for a unit. */
  rowActions?: (unit: IContentUnit) => PageHeaderAction[];
}

/**
 * The global Content list as a PatternFly `DataList`: loading/empty/error states, row expansion
 * (a selected-set over hrefs), and one `ContentListItem` per unit. Presentational — the page owns
 * the `DataView` shell, toolbar, filters, and pagination.
 */
export const ContentDataList: React.FC<IContentDataListProps> = ({
  units,
  isLoading,
  error,
  emptyState,
  loadingRows = 10,
  onLabelClick,
  onSelect,
  selectedHref,
  bulk,
  rowActions,
}) => {
  // Row expansion is a selected-set over the rows' hrefs (same hook used for selection).
  const hrefs = useMemo(
    () => units.map((unit) => unit.pulp_href ?? ""),
    [units],
  );
  const expansion = useSelectionState<string>({ items: hrefs });

  if (isLoading) {
    return (
      <DataList aria-label="Content list loading">
        {SKELETON_KEYS.slice(0, loadingRows).map((key) => (
          <DataListItem key={key}>
            <DataListItemRow>
              <DataListItemCells
                dataListCells={[
                  <DataListCell key="skeleton">
                    <Skeleton width="40%" screenreaderText="Loading content" />
                    <Skeleton width="25%" style={{ marginBlockStart: "8px" }} />
                  </DataListCell>,
                ]}
              />
            </DataListItemRow>
          </DataListItem>
        ))}
      </DataList>
    );
  }

  if (error != null) {
    return (
      <Bullseye>
        {isForbiddenError(error) ? (
          <UnauthorizedState />
        ) : (
          <ErrorState
            status="danger"
            titleText="Unable to load content"
            bodyText="Something went wrong while loading this list."
          />
        )}
      </Bullseye>
    );
  }

  if (units.length === 0) {
    return <Bullseye>{emptyState}</Bullseye>;
  }

  return (
    <DataList
      aria-label="Content list"
      selectedDataListItemId={selectedHref}
      onSelectDataListItem={onSelect ? (_event, id) => onSelect(id) : undefined}
    >
      {units.map((unit) => {
        const href = unit.pulp_href ?? "";
        return (
          <ContentListItem
            key={href}
            unit={unit}
            isExpanded={expansion.isItemSelected(href)}
            onToggle={() => expansion.toggleItem(href)}
            onLabelClick={onLabelClick}
            isSelectable={onSelect != null}
            actions={rowActions?.(unit)}
            check={
              bulk && {
                isChecked: bulk.selection.isSelected(href),
                isDisabled: bulk.isDisabled,
                onChange: (checked) =>
                  bulk.selection.setUnits({
                    units: [contentUnitRef(unit)],
                    isSelecting: checked,
                  }),
              }
            }
          />
        );
      })}
    </DataList>
  );
};
