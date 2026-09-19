import { expect, type Locator, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";

export interface ICreateUserInput {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface IEditUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
}

/** Page object for `/admin/users` (the react-data-view reference list). */
export class UsersPage extends DataViewList {
  constructor(page: Page) {
    super(page, "Users", "Users table");
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/users");
    await expect(this.heading).toBeVisible();
  }

  async openCreate(): Promise<Locator> {
    await this.page
      .getByRole("button", { name: "Create user", exact: true })
      .click();
    return this.page.getByRole("dialog", { name: "Create User" });
  }

  async create(input: ICreateUserInput): Promise<void> {
    const dialog = await this.openCreate();
    await dialog.getByLabel("Username").fill(input.username);
    await dialog.getByLabel("Password").fill(input.password);
    await this.fillOptional(dialog, input);
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async edit(username: string, changes: IEditUserInput): Promise<void> {
    await this.rowAction(username, "Edit");
    const dialog = this.page.getByRole("dialog", { name: `Edit ${username}` });
    await this.fillOptional(dialog, changes);
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async delete(username: string): Promise<void> {
    await this.rowAction(username, "Delete");
    await new ConfirmModal(this.page, "Delete User").confirm("Delete");
  }

  /** Assign an existing role to a user via the "Manage roles" dual-list modal. */
  async assignRole(username: string, roleName: string): Promise<void> {
    const dialog = await this.openRolesModal(username);
    await dialog
      .getByRole("textbox", { name: "Search available roles" })
      .fill(roleName);
    // The "chosen" pane is empty at this point, so the option is unambiguous.
    await dialog.getByRole("option", { name: roleName, exact: true }).click();
    await dialog.getByRole("button", { name: "Assign selected" }).click();
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  private async openRolesModal(username: string): Promise<Locator> {
    await this.row(username)
      .getByRole("button", { name: "Roles", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", {
      name: `Manage roles for ${username}`,
    });
    // Wait for both role queries to resolve (Save renders only once loaded).
    await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();
    return dialog;
  }

  private async fillOptional(
    dialog: Locator,
    input: IEditUserInput,
  ): Promise<void> {
    if (input.email !== undefined)
      await dialog.getByLabel("Email").fill(input.email);
    if (input.firstName !== undefined)
      await dialog.getByLabel("First name").fill(input.firstName);
    if (input.lastName !== undefined)
      await dialog.getByLabel("Last name").fill(input.lastName);
  }
}
