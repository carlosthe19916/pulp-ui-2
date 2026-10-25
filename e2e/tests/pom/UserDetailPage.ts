import { expect, type Locator, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataTable } from "./DataTable";
import { FormModal } from "./FormModal";
import { clickRowMenuItem } from "./rowMenu";

/** Page object for a user's detail page (`/admin/users/$userId`). */
export class UserDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly groupsTab: Locator;
  readonly rolesTab: Locator;
  readonly groupsTable: Locator;
  readonly rolesTable: Locator;
  /** The Groups / Roles tab tables with their toolbars and paginators. */
  readonly groups: DataTable;
  readonly roles: DataTable;

  constructor(page: Page, username: string) {
    this.page = page;
    this.title = page.getByRole("heading", { level: 1, name: username });
    this.groupsTab = page.getByRole("tab", { name: /^Groups \(\d+\)$/ });
    this.rolesTab = page.getByRole("tab", { name: /^Roles \(\d+\)$/ });
    this.groupsTable = page.getByRole("grid", { name: "User groups table" });
    this.rolesTable = page.getByRole("grid", { name: "User roles table" });
    const panel = page.getByRole("tabpanel");
    this.groups = new DataTable(panel, "User groups table");
    this.roles = new DataTable(panel, "User roles table");
  }

  async goto(id: number): Promise<void> {
    await this.page.goto(`/admin/users/${id}`);
    // The route loads the user before rendering ("Loading user"), which can take
    // a while on a busy backend.
    await expect(this.title).toBeVisible({ timeout: 15_000 });
  }

  /** Open the header's actions menu and choose an item ("Edit User", "Delete User"). */
  async headerAction(item: string): Promise<void> {
    await this.page.getByRole("button", { name: "Actions" }).click();
    await this.page.getByRole("menuitem", { name: item, exact: true }).click();
  }

  async openEdit(username: string): Promise<FormModal> {
    await this.headerAction("Edit User");
    const modal = new FormModal(this.page, `Edit ${username}`);
    await expect(modal.dialog).toBeVisible();
    return modal;
  }

  // --- Groups tab ---

  async addGroup(groupName: string): Promise<void> {
    await this.groupsTab.click();
    await this.page
      .getByRole("button", { name: "Add Group", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", { name: "Add User to Group" });
    await dialog.getByPlaceholder("Filter by Name").fill(groupName);
    await dialog
      .getByRole("grid", { name: "Select groups" })
      .getByRole("row")
      .filter({ hasText: groupName })
      .getByRole("checkbox")
      .check();
    await dialog.getByRole("button", { name: /^Add( \(\d+\))?$/ }).click();
    await expect(dialog).toBeHidden();
    await expect(
      this.groupsTable.getByRole("row").filter({ hasText: groupName }),
    ).toBeVisible();
  }

  async removeGroup(groupName: string): Promise<void> {
    const row = this.groupsTable
      .getByRole("row")
      .filter({ hasText: groupName });
    const item = this.page.getByRole("menuitem", {
      name: "Remove",
      exact: true,
    });
    await clickRowMenuItem(row, item);
    await new ConfirmModal(this.page, "Remove Group").confirm("Remove");
    await expect(
      this.groupsTable.getByRole("row").filter({ hasText: groupName }),
    ).toHaveCount(0);
  }

  // --- Roles tab ---

  async addRole(roleName: string): Promise<void> {
    const { dialog, checkbox } = await this.openAddRole(roleName);
    await checkbox.check();
    await dialog.getByRole("button", { name: /^Add( \(\d+\))?$/ }).click();
    await expect(dialog).toBeHidden();
    await expect(
      this.rolesTable.getByRole("row").filter({ hasText: roleName }),
    ).toBeVisible();
  }

  /** An already-assigned role is listed in Add Role but can't be picked again. */
  async expectRoleNotSelectable(roleName: string): Promise<void> {
    const { dialog, checkbox } = await this.openAddRole(roleName);
    await expect(checkbox).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  private async openAddRole(
    roleName: string,
  ): Promise<{ dialog: Locator; checkbox: Locator }> {
    await this.rolesTab.click();
    await this.page
      .getByRole("button", { name: "Add Role", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", { name: "Add Role to User" });
    await dialog.getByPlaceholder("Filter by Role").fill(roleName);
    const checkbox = dialog
      .getByRole("grid", { name: "Select roles" })
      .getByRole("row")
      .filter({ hasText: roleName })
      .getByRole("checkbox");
    return { dialog, checkbox };
  }

  async removeRole(roleName: string): Promise<void> {
    const row = this.rolesTable.getByRole("row").filter({ hasText: roleName });
    const item = this.page.getByRole("menuitem", {
      name: "Remove",
      exact: true,
    });
    await clickRowMenuItem(row, item);
    await new ConfirmModal(this.page, "Remove Role").confirm("Remove");
    await expect(
      this.rolesTable.getByRole("row").filter({ hasText: roleName }),
    ).toHaveCount(0);
  }

  // --- Header actions ---

  async deleteUser(): Promise<void> {
    await this.page.getByRole("button", { name: "Actions" }).click();
    await this.page
      .getByRole("menuitem", { name: "Delete User", exact: true })
      .click();
    await new ConfirmModal(this.page, "Delete User").confirm("Delete");
  }
}
