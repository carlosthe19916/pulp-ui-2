import { expect, type Locator, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";

export interface IContentPageOptions {
  path: string;
  heading: string;
  tableName: string;
  /** Singular entity noun, e.g. "Remote" (used in dialog + confirm titles). */
  singular: string;
  /** Exact label of the create button, e.g. "Create remote". */
  createButton: string;
}

/**
 * Generic page object for the content-management families (remotes, repositories,
 * distributions, publications), which all share the generic list + EntityModal +
 * ConfirmActionModal shell. Each family only differs by labels/paths.
 */
export class ContentPage extends DataViewList {
  constructor(
    page: Page,
    private readonly opts: IContentPageOptions,
  ) {
    super(page, opts.heading, opts.tableName);
  }

  async goto(): Promise<void> {
    await this.page.goto(this.opts.path);
    await expect(this.heading).toBeVisible();
  }

  async openCreate(): Promise<Locator> {
    await this.page
      .getByRole("button", { name: this.opts.createButton, exact: true })
      .click();
    return this.page.getByRole("dialog", {
      name: `Create ${this.opts.singular}`,
    });
  }

  /** Visible labels of the plugin-type selector options in the create modal. */
  async typeOptions(): Promise<string[]> {
    const dialog = await this.openCreate();
    const options = await dialog
      .getByRole("combobox", { name: "Type" })
      .locator("option")
      .allInnerTexts();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
    return options;
  }

  /**
   * Fill a create/edit dialog and submit. Works for both the plain modal and the
   * multi-step wizard (large forms like remotes): it fills whatever provided
   * fields are visible on the current step, clicks "Next" until the last step,
   * then clicks the submit button. Fields are located by ARIA role+name (not
   * getByLabel) because PatternFly adds a "*" text node to required-field labels.
   */
  private async fillAndSubmit(
    dialog: Locator,
    type: string | undefined,
    fields: Record<string, string>,
    submitLabel: string,
  ): Promise<void> {
    // Edit modals fetch the entity first and show a spinner; wait for the form
    // footer (Cancel is present in both the plain modal and the wizard) so we
    // never fill/navigate a not-yet-rendered form.
    await dialog
      .getByRole("button", { name: "Cancel", exact: true })
      .waitFor({ state: "visible" });

    if (type) {
      const typeSelect = dialog.getByRole("combobox", { name: "Type" });
      if ((await typeSelect.count()) > 0) {
        await typeSelect.selectOption({ label: type });
      }
    }

    const submit = dialog.getByRole("button", {
      name: submitLabel,
      exact: true,
    });
    const remaining = { ...fields };
    // Fill visible fields; advance via "Next" until the submit button appears
    // (the last wizard step, or immediately for a plain modal).
    for (let step = 0; step < 12; step++) {
      for (const [label, value] of Object.entries(remaining)) {
        const input = dialog.getByRole("textbox", { name: label, exact: true });
        if ((await input.count()) > 0 && (await input.isVisible())) {
          await input.fill(value);
          delete remaining[label];
        }
      }
      if ((await submit.count()) > 0) {
        break;
      }
      const next = dialog.getByRole("button", { name: "Next", exact: true });
      if ((await next.count()) === 0) {
        break;
      }
      await next.click();
    }

    await submit.click();
    await expect(dialog).toBeHidden();
  }

  /**
   * Create an entity. `type` is the visible plugin-type label (omit when only one
   * type is installed and no selector renders). `fields` are keyed by field label.
   */
  async create(input: {
    type?: string;
    fields: Record<string, string>;
  }): Promise<void> {
    const dialog = await this.openCreate();
    await this.fillAndSubmit(dialog, input.type, input.fields, "Create");
  }

  async editField(name: string, fields: Record<string, string>): Promise<void> {
    await this.rowAction(name, "Edit");
    const dialog = this.page.getByRole("dialog", { name: `Edit ${name}` });
    await expect(dialog).toBeVisible();
    await this.fillAndSubmit(dialog, undefined, fields, "Save");
  }

  async delete(name: string): Promise<void> {
    await this.rowAction(name, "Delete");
    await new ConfirmModal(this.page, `Delete ${this.opts.singular}`).confirm(
      "Delete",
    );
  }
}
