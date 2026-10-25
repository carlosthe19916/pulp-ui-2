import { expect, type Locator, type Page } from "@playwright/test";

import { BatchAddModal } from "./BatchAddModal";
import { ConfirmModal } from "./ConfirmModal";
import { DataTable } from "./DataTable";
import { clickRowMenuItem } from "./rowMenu";

export type RoleOwnerKind = "user" | "group";

/** The Roles tab of a user or group detail page (shared `RoleAssignmentsTab`). */
export class RoleAssignmentsTab {
  readonly page: Page;
  readonly tab: Locator;
  readonly table: DataTable;
  private readonly kind: RoleOwnerKind;

  constructor(page: Page, kind: RoleOwnerKind) {
    this.page = page;
    this.kind = kind;
    this.tab = page.getByRole("tab", { name: /^Roles \(\d+\)$/ });
    this.table = new DataTable(
      page.getByRole("tabpanel"),
      kind === "user" ? "User roles table" : "Group roles table",
    );
  }

  async open(): Promise<void> {
    await this.tab.click();
  }

  addButton(): Locator {
    return this.page.getByRole("button", { name: "Add Role", exact: true });
  }

  async openAdd(): Promise<BatchAddModal> {
    await this.open();
    await this.addButton().click();
    const modal = new BatchAddModal(this.page, {
      title: this.kind === "user" ? "Add Role to User" : "Add Role to Group",
      grid: "Select roles",
    });
    await expect(modal.dialog).toBeVisible();
    return modal;
  }

  /** Add global assignments of the given roles through the "Add Role" modal. */
  async add(roles: string[]): Promise<void> {
    const modal = await this.openAdd();
    for (const role of roles) await modal.select("Role", role);
    await modal.addButton().click();
    await expect(modal.dialog).toBeHidden();
  }

  /** Rows whose Role cell is exactly the role name. */
  rows(role: string): Locator {
    return this.table.rows.filter({
      has: this.page.getByRole("gridcell", { name: role, exact: true }),
    });
  }

  async remove(row: Locator): Promise<void> {
    await clickRowMenuItem(
      row,
      this.page.getByRole("menuitem", { name: "Remove", exact: true }),
    );
    await new ConfirmModal(this.page, "Remove Role").confirm("Remove");
  }
}
