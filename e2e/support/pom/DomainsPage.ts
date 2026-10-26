import { expect, type Locator, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";

export interface ICreateDomainInput {
  name: string;
  description?: string;
  /** Visible label of a storage backend option (defaults to local filesystem). */
  storageBackend?: string;
  /** Per-backend `storage_settings` values, keyed by the visible field label. */
  storageSettings?: Record<string, string>;
}

export interface IEditDomainInput {
  description?: string;
  storageBackend?: string;
  storageSettings?: Record<string, string>;
}

/** Page object for `/system-management/domains`. */
export class DomainsPage extends DataViewList {
  constructor(page: Page) {
    super(page, "Domains", "Domains table");
  }

  async goto(): Promise<void> {
    await this.page.goto("/system-management/domains");
    await expect(this.heading).toBeVisible();
  }

  /** When domains are disabled, the route renders a "not enabled" empty state. */
  async expectDisabledState(): Promise<void> {
    await this.page.goto("/system-management/domains");
    await expect(
      this.page.getByRole("heading", { name: "Domains are not enabled" }),
    ).toBeVisible();
  }

  async openCreate(): Promise<Locator> {
    await this.page
      .getByRole("button", { name: "Create domain", exact: true })
      .click();
    return this.page.getByRole("dialog", { name: "Create Domain" });
  }

  async create(input: ICreateDomainInput): Promise<void> {
    const dialog = await this.openCreate();
    await dialog.getByLabel("Name").fill(input.name);
    if (input.description !== undefined)
      await dialog.getByLabel("Description").fill(input.description);
    if (input.storageBackend !== undefined)
      await dialog
        .getByLabel("Storage backend")
        .selectOption({ label: input.storageBackend });
    for (const [label, value] of Object.entries(input.storageSettings ?? {})) {
      await dialog.getByLabel(label).fill(value);
    }
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async openEdit(name: string): Promise<Locator> {
    await this.rowAction(name, "Edit");
    return this.page.getByRole("dialog", { name: `Edit ${name}` });
  }

  async edit(name: string, changes: IEditDomainInput): Promise<void> {
    const dialog = await this.openEdit(name);
    if (changes.description !== undefined)
      await dialog.getByLabel("Description").fill(changes.description);
    if (changes.storageBackend !== undefined)
      await dialog
        .getByLabel("Storage backend")
        .selectOption({ label: changes.storageBackend });
    for (const [label, value] of Object.entries(
      changes.storageSettings ?? {},
    )) {
      await dialog.getByLabel(label).fill(value);
    }
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async delete(name: string): Promise<void> {
    await this.rowAction(name, "Delete");
    await new ConfirmModal(this.page, "Delete Domain").confirm("Delete");
  }

  async expectRowActionsDisabled(name: string): Promise<void> {
    const row = this.row(name);
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Kebab toggle" }).click();
    const edit = this.page.getByRole("menuitem", { name: "Edit", exact: true });
    const del = this.page.getByRole("menuitem", {
      name: "Delete",
      exact: true,
    });
    // Wait for the menu to actually open before asserting on its items.
    await expect(edit).toBeVisible();
    await expect(edit).toHaveAttribute("aria-disabled", "true");
    await expect(del).toHaveAttribute("aria-disabled", "true");
    await this.page.keyboard.press("Escape");
  }
}
