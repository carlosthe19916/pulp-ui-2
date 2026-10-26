import { expect, type Locator, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataTable } from "./DataTable";
import { FormModal } from "./FormModal";
import { clickRowMenuItem } from "./rowMenu";

/** Page object for a group's detail page (`/admin/groups/$groupId`). */
export class GroupDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly usersTab: Locator;
  readonly rolesTab: Locator;
  readonly usersTable: Locator;
  readonly rolesTable: Locator;
  /** The Users tab's table with its toolbar and paginators. */
  readonly users: DataTable;

  constructor(page: Page, groupName: string) {
    this.page = page;
    this.title = page.getByRole("heading", { level: 1, name: groupName });
    this.usersTab = page.getByRole("tab", { name: /^Users \(\d+\)$/ });
    this.rolesTab = page.getByRole("tab", { name: /^Roles \(\d+\)$/ });
    this.usersTable = page.getByRole("grid", { name: "Group users table" });
    this.rolesTable = page.getByRole("grid", { name: "Group roles table" });
    this.users = new DataTable(page.getByRole("tabpanel"), "Group users table");
  }

  /** Open a group's detail page by URL (`id` from the API) and wait for its header. */
  static async open(
    page: Page,
    { id, name }: { id: number; name: string },
  ): Promise<GroupDetailPage> {
    await page.goto(`/admin/groups/${id}`);
    const detail = new GroupDetailPage(page, name);
    await expect(detail.title).toBeVisible();
    return detail;
  }

  /** Open the header "Actions" menu and return one of its items (not clicked). */
  async actionsMenuItem(name: "Edit Group" | "Delete Group"): Promise<Locator> {
    await this.page
      .getByRole("button", { name: "Actions", exact: true })
      .click();
    return this.page.getByRole("menuitem", { name, exact: true });
  }

  async openEdit(name: string): Promise<FormModal> {
    await (await this.actionsMenuItem("Edit Group")).click();
    const modal = new FormModal(this.page, `Edit ${name}`);
    await expect(modal.dialog).toBeVisible();
    return modal;
  }

  addUserButton(): Locator {
    return this.page.getByRole("button", { name: "Add User", exact: true });
  }

  /** Open a member row's kebab and return its "Remove" item (not clicked). */
  async userRemoveItem(username: string): Promise<Locator> {
    await this.users
      .row(username)
      .getByRole("button", { name: "Kebab toggle" })
      .click();
    return this.page.getByRole("menuitem", { name: "Remove", exact: true });
  }

  // --- Users tab ---

  async addUser(username: string): Promise<void> {
    await this.usersTab.click();
    await this.page
      .getByRole("button", { name: "Add User", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", { name: "Add User to Group" });
    await dialog.getByPlaceholder("Filter by Username").fill(username);
    await dialog
      .getByRole("grid", { name: "Select users" })
      .getByRole("row")
      .filter({ hasText: username })
      .getByRole("checkbox")
      .check();
    await dialog.getByRole("button", { name: /^Add( \(\d+\))?$/ }).click();
    await expect(dialog).toBeHidden();
    await expect(
      this.usersTable.getByRole("row").filter({ hasText: username }),
    ).toBeVisible();
  }

  async removeUser(username: string): Promise<void> {
    const row = this.usersTable.getByRole("row").filter({ hasText: username });
    const item = this.page.getByRole("menuitem", {
      name: "Remove",
      exact: true,
    });
    await clickRowMenuItem(row, item);
    await new ConfirmModal(this.page, "Remove User").confirm("Remove");
    await expect(
      this.usersTable.getByRole("row").filter({ hasText: username }),
    ).toHaveCount(0);
  }

  // --- Roles tab ---

  async addRole(roleName: string): Promise<void> {
    await this.rolesTab.click();
    await this.page
      .getByRole("button", { name: "Add Role", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", { name: "Add Role to Group" });
    await dialog.getByPlaceholder("Filter by Role").fill(roleName);
    await dialog
      .getByRole("grid", { name: "Select roles" })
      .getByRole("row")
      .filter({ hasText: roleName })
      .getByRole("checkbox")
      .check();
    await dialog.getByRole("button", { name: /^Add( \(\d+\))?$/ }).click();
    await expect(dialog).toBeHidden();
    await expect(
      this.rolesTable.getByRole("row").filter({ hasText: roleName }),
    ).toBeVisible();
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

  async deleteGroup(): Promise<void> {
    await this.page.getByRole("button", { name: "Actions" }).click();
    await this.page
      .getByRole("menuitem", { name: "Delete Group", exact: true })
      .click();
    await new ConfirmModal(this.page, "Delete Group").confirm("Delete");
  }
}
