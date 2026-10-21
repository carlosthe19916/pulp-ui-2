import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Page object for the global Content page. Unlike the CRUD families (which use the shared
 * `DataViewList` table POM), the content list renders as a PatternFly `DataList` so rows can
 * vary by plugin type — it is a `role="list"` of `role="listitem"` rows, not an ARIA grid.
 * Read-only: no create/edit/delete.
 */
export class ContentListPage {
  readonly heading: Locator;
  readonly list: Locator;

  constructor(
    readonly page: Page,
    private readonly path = "/content-management/default/content",
  ) {
    this.heading = page.getByRole("heading", { level: 1, name: "Content" });
    this.list = page.getByRole("list", { name: "Content list" });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await expect(this.heading).toBeVisible();
  }

  /**
   * A DataList row containing the given text. Scoped to the list's direct `<li>` children so it
   * doesn't also match the `<li>` chips inside a row's `LabelGroup` (which is itself a list).
   */
  row(name: string): Locator {
    return this.list.locator("> li").filter({ hasText: name });
  }

  async expectRowVisible(name: string): Promise<void> {
    await expect(this.row(name)).toBeVisible();
  }

  /** Expand a row by clicking its toggle (the first button in the row). */
  async expandRow(name: string): Promise<void> {
    await this.row(name).getByRole("button").first().click();
  }
}
