import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Administration side-navigation helper, shared by the admin list specs.

const nav = (page: Page): Locator =>
  page.getByRole("navigation", { name: "Nav" });

/** Reveal the Administration pages; clicking an open group would close it. */
export const openAdministration = async (page: Page): Promise<void> => {
  const group = nav(page).getByRole("button", { name: "Administration" });
  if ((await group.getAttribute("aria-expanded")) !== "true") {
    await group.click();
  }
  await expect(group).toHaveAttribute("aria-expanded", "true");
};

/** Open an admin page through the Administration nav; assert its heading and highlight. */
export const openViaNav = async (page: Page, item: string): Promise<void> => {
  await page.goto("/");
  await openAdministration(page);
  await nav(page).getByRole("link", { name: item, exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: item, exact: true }),
  ).toBeVisible();
  await openAdministration(page);
  await expect(
    nav(page).getByRole("link", { name: item, exact: true }),
  ).toHaveAttribute("aria-current", "page");
};
