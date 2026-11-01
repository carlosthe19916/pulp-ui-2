import type { Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";

const nav = (page: Page) => page.getByRole("navigation", { name: "Nav" });

test.describe("Side navigation", () => {
  test("opens the current page's group after a reload", async ({
    remotesPage,
    page,
  }) => {
    await remotesPage.goto();
    await page.reload();

    await expect(
      nav(page).getByRole("button", { name: "Content Management" }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      nav(page).getByRole("link", { name: "Remotes", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav(page).getByRole("button", { name: "Administration" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("keeps the current page's group closed once the user closes it", async ({
    remotesPage,
    page,
  }) => {
    await remotesPage.goto();
    const group = nav(page).getByRole("button", { name: "Content Management" });
    await expect(group).toHaveAttribute("aria-expanded", "true");

    await group.click();

    await expect(group).toHaveAttribute("aria-expanded", "false");
  });
});
