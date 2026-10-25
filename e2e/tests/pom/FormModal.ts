import { expect, type Locator, type Page } from "@playwright/test";

/** A create / edit modal form: title, fields, submit and the in-form error alert. */
export class FormModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;

  constructor(page: Page, title: string) {
    this.page = page;
    this.dialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { level: 1, name: title, exact: true }),
    });
    this.title = this.dialog.getByRole("heading", { level: 1 });
  }

  /** A text field by its accessible name (a required label's "*" is not part of it). */
  field(label: string): Locator {
    return this.dialog.getByRole("textbox", { name: label, exact: true });
  }

  checkbox(label: string): Locator {
    return this.dialog.getByRole("checkbox", { name: label, exact: true });
  }

  button(name: string): Locator {
    return this.dialog.getByRole("button", { name, exact: true });
  }

  /** The in-form submission error (a danger `Alert` at the top of the form). */
  submitError(): Locator {
    return this.dialog.getByRole("heading", { name: /^Danger alert:/ });
  }

  async expectSubmitError(text: string | RegExp): Promise<void> {
    await expect(this.dialog).toContainText(text);
    await expect(this.submitError()).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden();
  }

  async close(how: "Cancel" | "×" | "Escape"): Promise<void> {
    if (how === "Cancel") await this.button("Cancel").click();
    else if (how === "×") await this.button("Close").click();
    else await this.page.keyboard.press("Escape");
    await this.expectClosed();
  }
}
