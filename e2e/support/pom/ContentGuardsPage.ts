import { expect, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";

export interface ICreateHeaderGuardInput {
  name: string;
  headerName: string;
  headerValue: string;
}

/** Page object for `/system-management/default/content-guards`. */
export class ContentGuardsPage extends DataViewList {
  constructor(page: Page) {
    super(page, "Content guards", "Content guards table");
  }

  async goto(): Promise<void> {
    await this.page.goto("/system-management/default/content-guards");
    await expect(this.heading).toBeVisible();
  }

  async createHeaderGuard(input: ICreateHeaderGuardInput): Promise<void> {
    await this.page
      .getByRole("button", { name: "Create content guard" })
      .click();
    const dialog = this.page.getByRole("dialog");
    await dialog.getByLabel("Type").selectOption({ label: "Header" });
    await dialog
      .getByRole("textbox", { name: "Name", exact: true })
      .fill(input.name);
    await dialog
      .getByRole("textbox", { name: "Header name" })
      .fill(input.headerName);
    await dialog
      .getByRole("textbox", { name: "Header value" })
      .fill(input.headerValue);
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  /** Open a guard's Edit modal, assert the prefilled header name, and rotate the value. */
  async editHeaderValue({
    name,
    headerName,
    value,
  }: {
    name: string;
    headerName: string;
    value: string;
  }): Promise<void> {
    await this.rowAction(name, "Edit");
    const dialog = this.page.getByRole("dialog");
    await expect(
      dialog.getByRole("textbox", { name: "Header name" }),
    ).toHaveValue(headerName);
    await dialog.getByRole("textbox", { name: "Header value" }).fill(value);
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async deleteGuard(name: string): Promise<void> {
    await this.rowAction(name, "Delete");
    await new ConfirmModal(this.page, "Delete content guard").confirm("Delete");
  }
}
