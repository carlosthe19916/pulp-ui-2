import { expect, type Locator, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";
import { FormModal } from "./FormModal";

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
      const input = dialog.getByRole("textbox", { name: "Add permission" });
      await input.fill(permission);
      await input.press("Enter");
      await expect(
        dialog.getByRole("button", { name: `Remove ${permission}` }),
      ).toBeVisible();
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

  /** A body row whose Name cell is exactly the role name. */
  exactRow(name: string): Locator {
    return this.list.rows.filter({
      has: this.page.getByRole("gridcell", { name, exact: true }),
    });
  }

  async openCreate(): Promise<FormModal> {
    await this.page
      .getByRole("button", { name: "Create Role", exact: true })
      .click();
    const modal = new FormModal(this.page, "Create Role");
    await expect(modal.dialog).toBeVisible();
    return modal;
  }

  async openEdit(name: string): Promise<FormModal> {
    await this.openRowMenu(name);
    await this.page
      .getByRole("menuitem", { name: "Edit", exact: true })
      .click();
    const modal = new FormModal(this.page, `Edit Role: ${name}`);
    await expect(modal.dialog).toBeVisible();
    return modal;
  }

  /** Open a row's kebab; menu items are then `page.getByRole("menuitem")`. */
  async openRowMenu(name: string): Promise<void> {
    await this.exactRow(name)
      .getByRole("button", { name: "Kebab toggle" })
      .click();
  }

  menuItem(name: string): Locator {
    return this.page.getByRole("menuitem", { name, exact: true });
  }

  /** The Locked filter toggle (shows the current option). */
  lockedToggle(): Locator {
    // The toolbar precedes the grid, so the first match is the toggle, not the
    // "Locked" column's sort button.
    return this.page
      .getByRole("main")
      .getByRole("button", { name: /^(All roles|Locked|Unlocked)$/ })
      .first();
  }

  /** Choose an option in the locked-status select (toggle shows the current label). */
  async filterLocked(label: LockedFilter): Promise<void> {
    if ((await this.lockedToggle().innerText()).trim() === label) return;
    await this.lockedToggle().click();
    // A new Locked value is a new query: wait for its page so callers read it.
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          response.url().includes("/roles/") &&
          (label === "All roles"
            ? !response.url().includes("locked=")
            : response.url().includes(`locked=${label === "Locked"}`)),
      ),
      this.page.getByRole("option", { name: label, exact: true }).click(),
    ]);
    await expect(this.lockedToggle()).toHaveText(label);
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
