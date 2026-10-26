import { expect, type Locator, type Page } from "@playwright/test";

import { DataTable } from "./DataTable";

/** A multi-select "Add …" modal: a selectable table and an "Add (n)" button. */
export class BatchAddModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly table: DataTable;

  constructor(page: Page, { title, grid }: { title: string; grid: string }) {
    this.page = page;
    this.dialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { level: 1, name: title, exact: true }),
    });
    this.table = new DataTable(this.dialog, grid);
  }

  /** "Add" or "Add (n)"; while saving its name starts with "Loading...". */
  addButton(): Locator {
    return this.dialog.getByRole("button", {
      name: /^(Loading\.\.\. )?Add( \(\d+\))?$/,
    });
  }

  button(name: string): Locator {
    return this.dialog.getByRole("button", { name, exact: true });
  }

  /** Filter to the row, then tick it. */
  async select(filterTitle: string, text: string): Promise<void> {
    await this.table.filter(filterTitle, text);
    await this.table.selectRow(text).check();
  }

  /** The bulk-select control's "Select page (n)" option. */
  async selectPage(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: "Bulk select toggle", exact: true })
      .click();
    await this.page.getByRole("menuitem", { name: /^Select page/ }).click();
  }

  async close(how: "Cancel" | "×" | "Escape"): Promise<void> {
    if (how === "Cancel") await this.button("Cancel").click();
    else if (how === "×") await this.button("Close").click();
    else await this.page.keyboard.press("Escape");
    await expect(this.dialog).toBeHidden();
  }
}
