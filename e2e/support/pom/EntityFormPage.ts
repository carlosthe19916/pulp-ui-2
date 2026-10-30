import { expect, type Locator, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";

/**
 * A create/edit form page (repositories, remotes, distributions, publications): Type
 * select, collapsible sections, secrets, code editors and the sticky Save/Cancel footer.
 * Fields are located by role + name: PatternFly adds a "*" to required labels.
 */
export class EntityFormPage {
  constructor(private readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await expect(this.page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  heading(name: string): Locator {
    return this.page.getByRole("heading", { level: 1, name });
  }

  textbox(label: string): Locator {
    return this.page.getByRole("textbox", { name: label, exact: true });
  }

  async fill(fields: Record<string, string>): Promise<void> {
    for (const [label, value] of Object.entries(fields)) {
      await this.textbox(label).fill(value);
    }
  }

  async selectType(label: string): Promise<void> {
    await this.page
      .getByRole("combobox", { name: "Type" })
      .selectOption({ label });
  }

  /** A collapsible section's toggle; its name may carry the collapsed summary. */
  sectionToggle(title: string): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${title}`) });
  }

  async expandSection(title: string): Promise<void> {
    const toggle = this.sectionToggle(title);
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }

  /**
   * Replace a code editor's text. `insertText` types it as one input, so Monaco doesn't
   * auto-indent or auto-close it.
   */
  async fillCode(label: string, text: string): Promise<void> {
    const editor = this.page.getByRole("textbox", { name: label, exact: true });
    await editor.click();
    await this.page.keyboard.press("ControlOrMeta+A");
    await this.page.keyboard.press("Delete");
    await this.page.keyboard.insertText(text);
  }

  /** Type a write-only value; on an edit page it first opens the input (Set / Change). */
  async setSecret(label: string, value: string): Promise<void> {
    const open = this.page.getByRole("button", {
      name: new RegExp(`^(Set|Change) ${label}$`),
    });
    if ((await open.count()) > 0) await open.click();
    await this.page.getByLabel(new RegExp(`^${label}`)).fill(value);
  }

  async clearSecret(label: string): Promise<void> {
    await this.page.getByRole("button", { name: `Clear ${label}` }).click();
    await expect(this.page.getByText("Cleared on save")).toBeVisible();
  }

  async submit(label: "Create" | "Save"): Promise<void> {
    await this.page.getByRole("button", { name: label, exact: true }).click();
  }

  /** Clicking away from a dirty form opens the leave prompt. */
  leavePrompt(): ConfirmModal {
    return new ConfirmModal(this.page, "Leave without saving?");
  }
}
