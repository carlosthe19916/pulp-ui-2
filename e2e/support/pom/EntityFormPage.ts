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

  heading(name: string | RegExp): Locator {
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

  /** Add chips to a string-list field (each value typed and entered). */
  async addListItems(label: string, values: string[]): Promise<void> {
    const input = this.textbox(label);
    for (const value of values) {
      await input.fill(value);
      await input.press("Enter");
    }
  }

  /** Remove one chip from a string-list field. */
  async removeListItem(value: string): Promise<void> {
    await this.page
      .getByRole("button", { name: new RegExp(`^close ${value}$`, "i") })
      .click();
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
    // The editor loads lazily behind a same-named fallback textarea; Monaco replaces it, so
    // wait for the editor's own upload control before typing.
    await expect(
      this.page.getByRole("button", {
        name: `Upload ${label.toLowerCase()} from a file`,
      }),
    ).toBeVisible();
    // Monaco's input sits under its rendered lines, which intercept a click: focus it.
    const editor = this.page.getByRole("textbox", { name: label, exact: true });
    await editor.focus();
    await this.page.keyboard.press("ControlOrMeta+A");
    await this.page.keyboard.press("Delete");
    await this.page.keyboard.insertText(text);
  }

  /**
   * Type a write-only value. An edit page shows a "Set"/"Change" button first, a create page
   * the input; wait until one renders before choosing.
   */
  async setSecret({
    label,
    value,
  }: {
    label: string;
    value: string;
  }): Promise<void> {
    const open = this.page.getByRole("button", {
      name: new RegExp(`^(Set|Change) ${label}$`),
    });
    const input = this.page.getByLabel(new RegExp(`^${label}`));
    await expect(open.or(input).first()).toBeVisible();
    if (await open.isVisible()) await open.click();
    await input.fill(value);
  }

  /** Open a resource picker (if closed) and type `term` into its filter. */
  async searchResource({
    label,
    term,
  }: {
    label: string;
    term: string;
  }): Promise<void> {
    const toggle = this.page.getByRole("button", { name: label, exact: true });
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    await this.page
      .getByRole("textbox", { name: `${label} filter` })
      .fill(term);
  }

  /** Choose `option` in a resource picker, narrowing it by `filter` (default: the option). */
  async pickResource({
    label,
    option,
    filter = option,
  }: {
    label: string;
    option: string;
    filter?: string;
  }): Promise<void> {
    await this.searchResource({ label, term: filter });
    await this.page.getByRole("option", { name: option, exact: true }).click();
  }

  /** The in-form error alert raised by a failed submit. */
  submitError(title: string): Locator {
    return this.page.getByRole("heading", {
      name: new RegExp(`^Danger alert:\\s*${title}$`),
    });
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
