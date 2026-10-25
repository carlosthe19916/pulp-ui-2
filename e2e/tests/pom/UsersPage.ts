import { expect, type Locator, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";
import { FormModal } from "./FormModal";
import { UserDetailPage } from "./UserDetailPage";

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

  /** Filter to the user and open its row's Edit modal. */
  async openEdit(username: string): Promise<FormModal> {
    // Re-typing the same filter sends no request (the page is cached), so only
    // filter when it isn't applied yet.
    if (
      (await this.page.getByPlaceholder("Filter by Username").inputValue()) !==
      username
    ) {
      await this.filterBy("Username", username);
    }
    await this.rowAction(username, "Edit");
    const modal = new FormModal(this.page, `Edit ${username}`);
    await expect(modal.dialog).toBeVisible();
    return modal;
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

  /** Click a user's username link and return its detail page object. */
  async openDetail(username: string): Promise<UserDetailPage> {
    await this.row(username)
      .getByRole("link", { name: username, exact: true })
      .click();
    const detail = new UserDetailPage(this.page, username);
    await expect(detail.title).toBeVisible();
    return detail;
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
