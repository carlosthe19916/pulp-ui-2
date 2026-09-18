import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Table } from "@patternfly/react-table";
import { css } from "@patternfly/react-styles";
import checkStyles from "@patternfly/react-styles/css/components/Check/check";
import tableStyles from "@patternfly/react-styles/css/components/Table/table";

import { dataViewBodyStates } from "./dataViewStates";

const emptyMarkup = (
  args: Parameters<typeof dataViewBodyStates>[0],
): string => {
  const { bodyStates } = dataViewBodyStates(args);
  return renderToStaticMarkup(<Table>{bodyStates.empty}</Table>);
};

describe("dataViewBodyStates empty state", () => {
  const base = {
    columnCount: 3,
    isEmpty: true,
    emptyState: <span>No results found</span>,
  };

  it("keeps the selection column narrow without rendering a checkbox", () => {
    const html = emptyMarkup({ ...base, hasSelectionColumn: true });
    expect(html).toContain(tableStyles.tableCheck);
    expect(html).not.toContain(tableStyles.tableToggle);
    expect(html).toContain(
      css(checkStyles.check, checkStyles.modifiers.standalone),
    );
    expect(html).not.toContain('type="checkbox"');
  });

  it("keeps the expansion column narrow without rendering a toggle", () => {
    const html = emptyMarkup({ ...base, hasExpansionColumn: true });
    expect(html).toContain(tableStyles.tableToggle);
    expect(html).not.toContain(tableStyles.tableCheck);
    expect(html).not.toContain("<button");
  });

  it("renders no control cells when the table has neither", () => {
    const html = emptyMarkup(base);
    expect(html).not.toContain(tableStyles.tableCheck);
    expect(html).not.toContain(tableStyles.tableToggle);
  });
});
