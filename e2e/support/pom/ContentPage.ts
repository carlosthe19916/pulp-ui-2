import { expect, type Locator, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";
import { EntityFormPage } from "./EntityFormPage";

export interface IContentPageOptions {
  path: string;
  heading: string;
  tableName: string;
  /** Singular entity noun, e.g. "Remote" (used in dialog + confirm titles). */
  singular: string;
  /** Exact label of the create button, e.g. "Create remote". */
  createButton: string;
  /** How create/edit open: a form page (ADR 0010) or, until migrated, a modal. */
  form?: "page" | "dialog";
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
    // Clear any lingering success toasts first — they overlap the create button.
    await this.dismissToasts();
    await this.page
      .getByRole("button", { name: this.opts.createButton, exact: true })
      .click();
    return this.page.getByRole("dialog", {
      name: `Create ${this.opts.singular}`,
    });
  }

  private get usesPages(): boolean {
    return this.opts.form === "page";
  }

  /** Fill a form page by field label, submit, and return to the list once it has saved. */
  private async fillAndSubmitPage(input: {
    type?: string;
    fields: Record<string, string>;
    submitLabel: "Create" | "Save";
  }): Promise<void> {
    const form = new EntityFormPage(this.page);
    if (input.type) {
      const typeSelect = this.page.getByRole("combobox", { name: "Type" });
      if ((await typeSelect.count()) > 0) await form.selectType(input.type);
    }
    await form.fill(input.fields);
    await form.submit(input.submitLabel);
    // A saved form leaves for the object's detail page.
    await expect(
      this.page.getByRole("button", { name: input.submitLabel, exact: true }),
    ).toBeHidden();
    await this.goto();
  }

  /** Visible labels of the plugin-type selector options in the create form. */
  async typeOptions(): Promise<string[]> {
    if (this.usesPages) {
      await this.dismissToasts();
      await this.page
        .getByRole("button", { name: this.opts.createButton, exact: true })
        .click();
      const options = await this.page
        .getByRole("combobox", { name: "Type" })
        .locator("option")
        .allInnerTexts();
      await this.goto();
      return options;
    }
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
      .waitFor({ state: "visible", timeout: 10_000 });

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
    if (this.usesPages) {
      await this.dismissToasts();
      await this.page
        .getByRole("button", { name: this.opts.createButton, exact: true })
        .click();
      await this.fillAndSubmitPage({ ...input, submitLabel: "Create" });
      return;
    }
    const dialog = await this.openCreate();
    await this.fillAndSubmit(dialog, input.type, input.fields, "Create");
  }

  async editField(name: string, fields: Record<string, string>): Promise<void> {
    await this.rowAction(name, "Edit");
    if (this.usesPages) {
      await this.fillAndSubmitPage({ fields, submitLabel: "Save" });
      return;
    }
    const dialog = this.page.getByRole("dialog", { name: `Edit ${name}` });
    await expect(dialog).toBeVisible();
    await this.fillAndSubmit(dialog, undefined, fields, "Save");
  }

  async delete(name: string): Promise<void> {
    // Clear any lingering success toasts first — they overlap the confirm dialog.
    await this.dismissToasts();
    await this.rowAction(name, "Delete");
    await new ConfirmModal(this.page, `Delete ${this.opts.singular}`).confirm(
      "Delete",
    );
  }

  /** Choose the plugin type in an open create dialog (no-op when only one type). */
  async selectType(dialog: Locator, typeLabel: string): Promise<void> {
    const typeSelect = dialog.getByRole("combobox", { name: "Type" });
    if ((await typeSelect.count()) > 0) {
      await typeSelect.selectOption({ label: typeLabel });
    }
  }

  /**
   * Open the resource picker for a field and return its option listbox. The menu is
   * portalled, so the listbox is page-level, not inside the dialog.
   */
  async openResourcePicker(
    dialog: Locator,
    fieldLabel: string,
  ): Promise<Locator> {
    await dialog.getByRole("button", { name: fieldLabel, exact: true }).click();
    const listbox = this.page.getByRole("listbox");
    await listbox.waitFor({ state: "visible", timeout: 10_000 });
    return listbox;
  }

  /**
   * Open a resource picker, filter to `optionName`, and select it. The menu is
   * portalled (page-level), and the filter narrows the (possibly server-paged)
   * options so the target is rendered before we click it.
   */
  async selectResource(
    dialog: Locator,
    fieldLabel: string,
    optionName: string,
  ): Promise<void> {
    const listbox = await this.openResourcePicker(dialog, fieldLabel);
    const filter = this.page.getByLabel(`${fieldLabel} filter`);
    if ((await filter.count()) > 0) {
      await filter.fill(optionName);
    }
    await listbox
      .getByRole("option", { name: optionName, exact: true })
      .click();
  }

  /**
   * Close a resource picker by toggling it again — not via Escape, which a
   * PatternFly Modal treats as "close the modal" and would dismiss the form.
   */
  async closeResourcePicker(
    dialog: Locator,
    fieldLabel: string,
  ): Promise<void> {
    await dialog.getByRole("button", { name: fieldLabel, exact: true }).click();
    await this.page
      .getByRole("listbox")
      .waitFor({ state: "hidden", timeout: 10_000 });
  }
}
