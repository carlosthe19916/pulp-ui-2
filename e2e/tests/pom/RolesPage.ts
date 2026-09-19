import { expect, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";

export interface ICreateRoleInput {
  name: string;
  description?: string;
  /** A custom permission string to attach (any value; adds one to the count). */
  permission?: string;
}

export type LockedFilter = "All roles" | "Locked" | "Unlocked";

/** Page object for `/admin/roles`. */
export class RolesPage extends DataViewList {
  constructor(page: Page) {
    super(page, "Roles", "Roles table");
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/roles");
    await expect(this.heading).toBeVisible();
  }

  async create({
    name,
    description,
    permission,
  }: ICreateRoleInput): Promise<void> {
    await this.page
      .getByRole("button", { name: "Create Role", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", { name: "Create Role" });
    await dialog.getByLabel("Name").fill(name);
    if (description !== undefined)
      await dialog.getByLabel("Description").fill(description);
    if (permission) {
      await dialog
        .getByRole("textbox", { name: "Add custom permission" })
        .fill(permission);
      await dialog.getByRole("button", { name: "Add", exact: true }).click();
    }
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async edit(name: string, changes: { description?: string }): Promise<void> {
    await this.rowAction(name, "Edit");
    const dialog = this.page.getByRole("dialog", {
      name: `Edit Role: ${name}`,
    });
    if (changes.description !== undefined)
      await dialog.getByLabel("Description").fill(changes.description);
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async delete(name: string): Promise<void> {
    await this.rowAction(name, "Delete");
    await new ConfirmModal(this.page, "Delete Role").confirm("Delete");
  }

  /** Choose an option in the locked-status select (toggle shows the current label). */
  async filterLocked(label: LockedFilter): Promise<void> {
    // The MenuToggle shows the current selection; scope to it (via OUIA type) so
    // it isn't confused with the "Locked" column-header sort button.
    await this.page
      .locator('[data-ouia-component-type="PF6/MenuToggle"]')
      .filter({ hasText: /^(All roles|Locked|Unlocked)$/ })
      .click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  /** Assert the first row's Edit/Delete actions are disabled (used for a locked role). */
  async expectFirstRowActionsDisabled(): Promise<void> {
    const firstRow = this.table.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();
    await firstRow.getByRole("button", { name: "Kebab toggle" }).click();
    await expect(
      this.page.getByRole("menuitem", { name: "Edit", exact: true }),
    ).toHaveAttribute("aria-disabled", "true");
    await expect(
      this.page.getByRole("menuitem", { name: "Delete", exact: true }),
    ).toHaveAttribute("aria-disabled", "true");
    await this.page.keyboard.press("Escape");
  }
}
