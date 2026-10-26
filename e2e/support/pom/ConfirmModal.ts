import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Component object for the shared `ConfirmActionModal`. Matched by its header
 * title (e.g. "Delete User", "Remove Role") so callers read declaratively.
 */
export class ConfirmModal {
  readonly page: Page;
  readonly dialog: Locator;

  constructor(page: Page, title: string) {
    this.page = page;
    this.dialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { level: 1, name: title, exact: true }),
    });
  }

  button(name: string): Locator {
    return this.dialog.getByRole("button", { name, exact: true });
  }

  /** Click the confirm button ("Delete" by default, "Remove" for detach flows). */
  async confirm(label = "Delete"): Promise<void> {
    await expect(this.dialog).toBeVisible();
    await this.button(label).click();
    await expect(this.dialog).toBeHidden();
  }

  async cancel(): Promise<void> {
    await this.dismiss("Cancel");
  }

  async dismiss(how: "Cancel" | "×" | "Escape"): Promise<void> {
    if (how === "Cancel") await this.button("Cancel").click();
    else if (how === "×") await this.button("Close").click();
    else await this.page.keyboard.press("Escape");
    await expect(this.dialog).toBeHidden();
  }
}
