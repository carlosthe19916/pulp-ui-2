import type React from "react";

import type { ExpandableContent } from "@patternfly/react-data-view";

/**
 * Builds compound-expand content for one column of a `<DataViewTable indexBy="id">`:
 * for each entity whose `render` returns non-null, the cell at `columnIndex`
 * becomes a toggle that expands `content`. Entities whose `render` returns `null`
 * stay plain (no toggle). Pure and business-logic-free — compose several calls
 * (one per expandable column) by concatenation into the table's `expandedRows`.
 *
 * A compound table may have several expandable cells per row (different
 * `columnIndex`); only one opens at a time per row. Matching is by `rowId`, which
 * must equal each row's `indexBy` value (e.g. `pulp_href`).
 */
export const compoundExpansions = <T,>({
  entities,
  columnIndex,
  rowId,
  render,
}: {
  entities: T[];
  columnIndex: number;
  rowId: (entity: T) => string | number;
  render: (entity: T) => React.ReactNode | null;
}): ExpandableContent[] =>
  entities.flatMap((entity) => {
    const content = render(entity);
    return content == null
      ? []
      : [{ rowId: rowId(entity), columnId: columnIndex, content }];
  });
