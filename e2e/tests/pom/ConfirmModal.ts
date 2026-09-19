import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Component object for the shared `ConfirmActionModal`. Matched by its header
 * title (e.g. "Delete User", "Remove Role") so callers read declaratively.
 */
export class ConfirmModal {
  readonly dialog: Locator;

  constructor(page: Page, title: string) {
    this.dialog = page.getByRole("dialog", { name: title });
  }

  /** Click the confirm button ("Delete" by default, "Remove" for detach flows). */
  async confirm(label = "Delete"): Promise<void> {
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole("button", { name: label, exact: true }).click();
    await expect(this.dialog).toBeHidden();
  }

  async cancel(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await expect(this.dialog).toBeHidden();
  }
}
