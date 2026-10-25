import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The top-right toast `AlertGroup`; each toast is a heading "<Variant> alert: <title>".
 * An open modal marks the rest of the page `aria-hidden`, toasts included, so these
 * queries include hidden elements.
 */
export class Toasts {
  constructor(private readonly page: Page) {}

  success(title: string | RegExp): Locator {
    return this.toast("Success", title);
  }

  danger(title: string | RegExp): Locator {
    return this.toast("Danger", title);
  }

  /** Every toast heading currently shown (toasts are list items; in-form alerts aren't). */
  all(): Locator {
    return this.page
      .getByRole("listitem", { includeHidden: true })
      .getByRole("heading", {
        level: 4,
        name: / alert: /,
        includeHidden: true,
      });
  }

  async expectNone(): Promise<void> {
    await expect(this.all()).toHaveCount(0);
  }

  /** A danger toast's body text (the server's reason). */
  dangerBody(title: string | RegExp): Locator {
    return this.page
      .getByRole("listitem", { includeHidden: true })
      .filter({ has: this.heading("Danger", title) });
  }

  private toast(variant: string, title: string | RegExp): Locator {
    return this.page
      .getByRole("listitem", { includeHidden: true })
      .getByRole("heading", this.headingOptions(variant, title));
  }

  private heading(variant: string, title: string | RegExp): Locator {
    return this.page.getByRole("heading", this.headingOptions(variant, title));
  }

  private headingOptions(variant: string, title: string | RegExp) {
    const name =
      typeof title === "string"
        ? `${variant} alert: ${title}`
        : new RegExp(`${variant} alert: ${title.source}`);
    return { level: 4, name, exact: true, includeHidden: true };
  }
}
