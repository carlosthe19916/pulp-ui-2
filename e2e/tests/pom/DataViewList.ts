import { expect, type Locator, type Page } from "@playwright/test";

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

  protected constructor(page: Page, headingName: string, tableName: string) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1, name: headingName });
    // @patternfly/react-data-view renders an ARIA grid (role="grid"), not a table.
    this.table = page.getByRole("grid", { name: tableName });
  }

  /**
   * Type into a `DataViewTextFilter` and wait for the debounced, server-side
   * filtered fetch to land.
   *
   * Applying a new filter value is a fresh query key with no cache, so the list
   * flips to its loading state and swaps the whole body for a skeleton — briefly
   * unmounting every row. Waiting on the network response (a real event, not a
   * fixed delay) means the settled, filtered rows are mounted before any caller
   * interacts with them, instead of racing the skeleton swap.
   */
  async filterBy(title: string, value: string): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          response.url().includes(encodeURIComponent(value)),
      ),
      this.page.getByPlaceholder(`Filter by ${title}`).fill(value),
    ]);
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
    await expect(this.row(name)).toHaveCount(0);
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
