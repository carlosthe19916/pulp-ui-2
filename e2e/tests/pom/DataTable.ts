import { expect, type Locator, type Page } from "@playwright/test";

export type SortDirection = "ascending" | "descending" | "none";

/**
 * One `@patternfly/react-data-view` table with its toolbar and paginators, scoped to
 * where it lives (the page's `main`, a tab panel or a modal), so the same object
 * drives every admin list, detail tab and "Add" modal table.
 */
export class DataTable {
  readonly scope: Locator;
  /** @patternfly/react-data-view renders an ARIA grid (role="grid"), not a table. */
  readonly grid: Locator;
  /** Body rows only (the header row sits in the first rowgroup). */
  readonly rows: Locator;
  readonly page: Page;

  constructor(scope: Locator, gridName: string) {
    this.scope = scope;
    this.page = scope.page();
    this.grid = scope.getByRole("grid", { name: gridName, exact: true });
    this.rows = this.grid.getByRole("rowgroup").nth(1).getByRole("row");
  }

  /** A body row containing the text (unique names make this exact). */
  row(text: string): Locator {
    return this.rows.filter({ hasText: text });
  }

  filterInput(title: string): Locator {
    return this.scope.getByPlaceholder(`Filter by ${title}`);
  }

  /**
   * Type into a text filter and wait for the debounced, server-side fetch. A new
   * filter is a fresh query key, so the body swaps to a skeleton; waiting on the
   * response means the filtered rows are mounted before the caller acts on them.
   */
  async filter(title: string, value: string): Promise<void> {
    const trimmed = value.trim();
    // Clearing a filter (or filtering to a value seen within the 10s stale time)
    // is served from the React Query cache with no network request, so the wait
    // may never resolve; fall back to the caller's retrying assertions instead of
    // hanging.
    const fetched = this.page
      .waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          (trimmed === ""
            ? response.url().includes("limit=")
            : decodeURIComponent(response.url().replace(/\+/g, " ")).includes(
                trimmed,
              )),
        { timeout: 10_000 },
      )
      .catch(() => undefined);
    await Promise.all([fetched, this.filterInput(title).fill(value)]);
  }

  /** The toolbar's "Clear filters" button (PatternFly's label; the empty state's says "Clear all filters"). */
  clearAllFiltersInToolbar(): Locator {
    return this.scope.getByRole("button", {
      name: "Clear filters",
      exact: true,
    });
  }

  /** The empty state's "Clear all filters" link inside the grid. */
  clearAllFiltersInEmptyState(): Locator {
    return this.grid.getByRole("button", {
      name: "Clear all filters",
      exact: true,
    });
  }

  /** Remove a filter chip (label) by its value. */
  async removeChip(value: string): Promise<void> {
    await this.scope
      .getByRole("button", {
        name: new RegExp(`^close ${escape(value)}$`, "i"),
      })
      .click();
  }

  columnHeader(name: string): Locator {
    return this.grid.getByRole("columnheader", { name, exact: true });
  }

  /** Header texts in order; unnamed (select / actions) headers read as "". */
  async headerTexts(): Promise<string[]> {
    const texts = await this.grid
      .getByRole("rowgroup")
      .first()
      .getByRole("columnheader")
      .allInnerTexts();
    return texts.map((text) => text.trim());
  }

  /** Click a sortable header and wait for the re-sorted page to arrive. */
  async sortBy(column: string): Promise<void> {
    // Sorting a column back to its default ascending order reuses the initial,
    // cache-fresh query, so Pulp may not be hit; don't hang if no request fires —
    // the caller asserts the new aria-sort and rows.
    const fetched = this.page
      .waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          response.url().includes("limit="),
        { timeout: 10_000 },
      )
      .catch(() => undefined);
    await Promise.all([
      fetched,
      this.columnHeader(column).getByRole("button").click(),
    ]);
  }

  async expectSorted(column: string, direction: SortDirection): Promise<void> {
    await expect(this.columnHeader(column)).toHaveAttribute(
      "aria-sort",
      direction,
    );
  }

  /** The visible text of one column, row by row. */
  async columnTexts(column: string): Promise<string[]> {
    const index = (await this.headerTexts()).indexOf(column);
    if (index < 0) throw new Error(`No column "${column}"`);
    const texts: string[] = [];
    for (const row of await this.rows.all()) {
      texts.push(
        (await row.getByRole("gridcell").nth(index).innerText()).trim(),
      );
    }
    return texts;
  }

  /** Wait until the body shows real rows (not the loading skeleton). */
  async expectLoaded(): Promise<void> {
    // Skeleton rows carry no text; a data, empty or error row always does. This
    // resolves the instant the rows render, so the generous timeout costs nothing
    // on the happy path — it only absorbs a slow first fetch (a server-paged modal
    // list against a busy shared backend), where the default 5s is too tight.
    await expect(this.rows.first()).not.toHaveText(/^\s*$/, {
      timeout: 15_000,
    });
  }

  /** The body's single empty / error state row (its heading text). */
  stateHeading(text: string): Locator {
    return this.grid.getByRole("heading", { name: text, exact: true });
  }

  /** The top (0) or bottom (1) paginator. */
  paginator(which: "top" | "bottom" = "top"): Paginator {
    return new Paginator(this.scope, which === "top" ? 0 : 1);
  }

  selectRow(text: string): Locator {
    return this.row(text).getByRole("checkbox");
  }
}

/** PatternFly `Pagination`: an item-range toggle plus a "Pagination" nav. */
export class Paginator {
  readonly nav: Locator;
  readonly toggle: Locator;

  constructor(scope: Locator, index: number) {
    this.nav = scope.getByRole("navigation", { name: "Pagination" }).nth(index);
    // The per-page toggle is named by the item range, e.g. "1 - 10 of 25".
    this.toggle = scope
      .getByRole("button", { name: /^\d+ - \d+ of \d+$/ })
      .nth(index);
  }

  next(): Locator {
    return this.nav.getByRole("button", { name: "Go to next page" });
  }

  previous(): Locator {
    return this.nav.getByRole("button", { name: "Go to previous page" });
  }

  first(): Locator {
    return this.nav.getByRole("button", { name: "Go to first page" });
  }

  last(): Locator {
    return this.nav.getByRole("button", { name: "Go to last page" });
  }

  currentPage(): Locator {
    return this.nav.getByRole("spinbutton", { name: "Current page" });
  }

  async goToPage(page: number): Promise<void> {
    await this.currentPage().fill(String(page));
    await this.currentPage().press("Enter");
  }

  async setPerPage(size: 10 | 20): Promise<void> {
    await this.toggle.click();
    await this.toggle
      .page()
      .getByRole("menuitem", { name: `${size} per page` })
      .click();
  }

  /** The "<first> - <last> of <total>" text. */
  async range(): Promise<{ first: number; last: number; total: number }> {
    const text = (await this.toggle.innerText()).trim();
    const [, first, last, total] = text.match(/(\d+) - (\d+) of (\d+)/) ?? [];
    return { first: Number(first), last: Number(last), total: Number(total) };
  }

  async expectRange(expected: string | RegExp): Promise<void> {
    await expect(this.toggle).toHaveText(expected);
  }
}

const escape = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
