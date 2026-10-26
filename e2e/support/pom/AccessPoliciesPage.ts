import { expect, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";
import { FormModal } from "./FormModal";

/** Page object for `/admin/access-policies`. */
export class AccessPoliciesPage extends DataViewList {
  constructor(page: Page) {
    super(page, "Access policies", "Access policies table");
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/access-policies");
    await expect(this.heading).toBeVisible();
  }

  /** Filter to one viewset; `viewset_name` filters by substring, so pick the exact row. */
  async find(viewset: string): Promise<void> {
    await this.filterBy("Viewset", viewset);
    await expect(this.exactRow(viewset)).toBeVisible();
  }

  exactRow(viewset: string) {
    return this.list.rows.filter({
      has: this.page.getByRole("gridcell", { name: viewset, exact: true }),
    });
  }

  async openEdit(viewset: string): Promise<FormModal> {
    await this.rowMenuItem(viewset, "Edit");
    const modal = new FormModal(this.page, `Edit policy "${viewset}"`);
    await expect(modal.dialog).toBeVisible();
    return modal;
  }

  async openReset(viewset: string): Promise<ConfirmModal> {
    await this.rowMenuItem(viewset, "Reset to default");
    return new ConfirmModal(this.page, "Reset access policy");
  }

  private async rowMenuItem(viewset: string, item: string): Promise<void> {
    await this.exactRow(viewset)
      .getByRole("button", { name: "Kebab toggle" })
      .click();
    await this.page.getByRole("menuitem", { name: item, exact: true }).click();
  }
}
