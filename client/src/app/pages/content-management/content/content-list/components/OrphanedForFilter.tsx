import type React from "react";

import {
  TextInput,
  ToolbarFilter,
  type ToolbarLabel,
} from "@patternfly/react-core";

interface IOrphanedForFilterProps {
  filterId: string;
  title: string;
  value?: string;
  onChange?: (event: unknown, value: string) => void;
  showToolbarItem?: boolean;
}

/**
 * Numeric filter for `orphaned_for` (minutes a unit has been orphaned). A number input rather
 * than free text; composed into `DataViewFilters` like the other custom filters (renders a
 * `ToolbarFilter`, carries `filterId`/`title`, uses the injected `value`/`onChange`/`showToolbarItem`).
 */
export const OrphanedForFilter: React.FC<IOrphanedForFilterProps> = ({
  filterId,
  title,
  value = "",
  onChange,
  showToolbarItem,
}) => {
  const labels: ToolbarLabel[] = value
    ? [{ key: value, node: `${value} min` }]
    : [];

  return (
    <ToolbarFilter
      labels={labels}
      deleteLabel={() => onChange?.(undefined, "")}
      categoryName={title}
      showToolbarItem={showToolbarItem}
    >
      <TextInput
        id={`${filterId}-input`}
        type="number"
        min={0}
        aria-label={title}
        placeholder={`Filter by ${title}`}
        value={value}
        onChange={(_event, next) => onChange?.(undefined, next)}
      />
    </ToolbarFilter>
  );
};
