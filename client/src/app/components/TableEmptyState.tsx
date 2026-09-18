import type React from "react";

import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from "@patternfly/react-core";
import { CubesIcon, SearchIcon } from "@patternfly/react-icons";

interface ITableEmptyStateProps {
  title: string;
  body?: React.ReactNode;
  icon?: React.ComponentType;
  /** Render the "no matches for the current filter" variant. */
  isFiltered?: boolean;
  onClearFilters?: () => void;
  filteredTitle?: string;
  filteredBody?: React.ReactNode;
}

/** Pass as the `emptyState` node to `dataViewBodyStates`. */
export const TableEmptyState: React.FC<ITableEmptyStateProps> = ({
  title,
  body,
  icon,
  isFiltered,
  onClearFilters,
  filteredTitle = "No results found",
  filteredBody = "No results match the current filter. Try adjusting or clearing your filters.",
}) => {
  if (isFiltered) {
    return (
      <EmptyState
        variant="sm"
        icon={SearchIcon}
        titleText={filteredTitle}
        headingLevel="h4"
      >
        <EmptyStateBody>{filteredBody}</EmptyStateBody>
        {onClearFilters && (
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="link" onClick={onClearFilters}>
                Clear all filters
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        )}
      </EmptyState>
    );
  }

  return (
    <EmptyState
      variant="sm"
      icon={icon ?? CubesIcon}
      titleText={title}
      headingLevel="h4"
    >
      {body && <EmptyStateBody>{body}</EmptyStateBody>}
    </EmptyState>
  );
};
