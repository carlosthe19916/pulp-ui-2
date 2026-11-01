import { expect, type Page } from "@playwright/test";

import { DataViewList } from "./DataViewList";

/** Page object for `/monitoring/workers`. */
export class WorkersPage extends DataViewList {
  constructor(page: Page) {
    super(page, "Workers", "Workers table");
  }

  async goto(): Promise<void> {
    await this.page.goto("/monitoring/workers");
    await expect(this.heading).toBeVisible();
  }
}
