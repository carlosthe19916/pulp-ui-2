import { expect, type Page } from "@playwright/test";

import { ConfirmModal } from "./ConfirmModal";
import { DataViewList } from "./DataViewList";

export interface IContentPageOptions {
  path: string;
  heading: string;
  tableName: string;
  /** Singular entity noun, e.g. "Remote" (used in the delete confirm title). */
  singular: string;
}

/**
 * The list page of a content-management family (remotes, repositories, distributions,
 * publications). Create and edit are form pages: drive them with `EntityFormPage`.
 */
export class ContentPage extends DataViewList {
  constructor(
    page: Page,
    private readonly opts: IContentPageOptions,
  ) {
    super(page, opts.heading, opts.tableName);
  }

  async goto(): Promise<void> {
    await this.page.goto(this.opts.path);
    await expect(this.heading).toBeVisible();
  }

  async delete(name: string): Promise<void> {
    // Clear any lingering success toasts first — they overlap the confirm dialog.
    await this.dismissToasts();
    await this.rowAction(name, "Delete");
    await new ConfirmModal(this.page, `Delete ${this.opts.singular}`).confirm(
      "Delete",
    );
  }
}
