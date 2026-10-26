import { expect, type Locator, type Page } from "@playwright/test";

import { DataTable } from "./DataTable";
import { clickRowMenuItem } from "./rowMenu";

/**
 * Base class for the admin list screens, which are all built on
 * `@patternfly/react-data-view`. Encapsulates the shared toolbar/table/row-action
 * mechanics so each page object only adds its own modal-form helpers.
 */
export abstract class DataViewList {
  readonly page: Page;
  readonly heading: Locator;
  readonly table: Locator;
  /** The table with its toolbar and paginators (sort, chips, paging). */
  readonly list: DataTable;

  protected constructor(page: Page, headingName: string, tableName: string) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1, name: headingName });
    this.list = new DataTable(page.getByRole("main"), tableName);
    this.table = this.list.grid;
  }

  /**
   * Type into a `DataViewTextFilter` and wait for the debounced, server-side
   * filtered fetch to land. Delegates to {@link DataTable.filter}, whose wait is
   * tolerant of a cache-served refetch (clearing a filter, or re-typing a value
   * seen within the 10s stale time, fires no network request) so it falls back to
   * the caller's retrying assertions instead of hanging to the test timeout.
   */
  async filterBy(title: string, value: string): Promise<void> {
    await this.list.filter(title, value);
  }

  /** A table body row that contains the given text (unique names make this exact). */
  row(name: string): Locator {
    return this.table.getByRole("row").filter({ hasText: name });
  }

  /** Open a row's kebab menu and click one of its items (Edit / Delete / Remove). */
  async rowAction(name: string, action: string): Promise<void> {
    const item = this.page.getByRole("menuitem", { name: action, exact: true });
    await clickRowMenuItem(this.row(name), item);
  }

  async expectRowVisible(name: string): Promise<void> {
    await expect(this.row(name)).toBeVisible();
  }

  async expectRowGone(name: string): Promise<void> {
    // Async (202 + task) deletes — remotes, repositories, distributions — only drop
    // the row once the delete task settles and the next task-status poll (every 5s,
    // DEFAULT_REFETCH_INTERVAL) invalidates the list. The default 5s expect timeout
    // sits right on that boundary, so wait generously past one poll cycle.
    await expect(this.row(name)).toHaveCount(0, { timeout: 15_000 });
  }

  /** Expand a compound-expandable row by clicking its toggle cell (the only button). */
  async expandRow(name: string): Promise<void> {
    await this.row(name).getByRole("button").first().click();
  }

  /**
   * Close open toast notifications. They auto-dismiss after 8s, but a test acting
   * faster stacks them in the top-right `AlertGroup`, where they overlap the create
   * button and confirm dialog and intercept clicks. OUIA attrs are PF's test hooks.
   */
  async dismissToasts(): Promise<void> {
    const closeButtons = this.page.locator(
      '[data-ouia-component-type="PF6/Alert"] button[aria-label*="lose"]',
    );
    for (
      let remaining = await closeButtons.count();
      remaining > 0;
      remaining--
    ) {
      await closeButtons
        .first()
        .click({ timeout: 2000 })
        .catch(() => {
          // The toast may auto-dismiss between locating and clicking — ignore.
        });
    }
  }
}
