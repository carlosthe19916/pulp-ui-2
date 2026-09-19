import { expect, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";
import { GroupDetailPage } from "./GroupDetailPage";

/** Page object for `/admin/groups`. */
export class GroupsPage extends DataViewList {
  constructor(page: Page) {
    super(page, "Groups", "Groups table");
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/groups");
    await expect(this.heading).toBeVisible();
  }

  async create(name: string): Promise<void> {
    await this.page
      .getByRole("button", { name: "Create Group", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", { name: "Create Group" });
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async rename(name: string, newName: string): Promise<void> {
    await this.rowAction(name, "Edit");
    const dialog = this.page.getByRole("dialog", { name: `Edit ${name}` });
    await dialog.getByLabel("Name").fill(newName);
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async delete(name: string): Promise<void> {
    await this.rowAction(name, "Delete");
    await new ConfirmModal(this.page, "Delete Group").confirm("Delete");
  }

  /** Click a group's name link and return its detail page object. */
  async openDetail(name: string): Promise<GroupDetailPage> {
    await this.row(name).getByRole("link", { name, exact: true }).click();
    const detail = new GroupDetailPage(this.page, name);
    await expect(detail.title).toBeVisible();
    return detail;
  }
}
