import { expect, test } from "@playwright/test";

import { waitForHydration } from "./support";

test.describe("navigation", () => {
  test("navbar 'Docs' opens the docs intro page", async ({ page }) => {
    await page.goto("/");

    await page
      .locator("nav.navbar")
      .getByRole("link", { name: "Docs", exact: true })
      .click();

    await expect(page).toHaveURL(/\/docs\/intro$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("navbar 'Features' jumps to the features section", async ({ page }) => {
    await page.goto("/");

    await page
      .locator("nav.navbar")
      .getByRole("link", { name: "Features", exact: true })
      .click();

    await expect(page).toHaveURL(/#features$/);
    await expect(page.getByTestId("home-features")).toBeInViewport();
  });

  test("external navbar links point at the right destinations", async ({
    page,
  }) => {
    await page.goto("/");
    const navbar = page.locator("nav.navbar");

    await expect(
      navbar.getByRole("link", { name: /Pulp Project/ }),
    ).toHaveAttribute("href", "https://pulpproject.org/");

    await expect(navbar.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      /^https:\/\/github\.com\//,
    );
  });

  test("dark-mode toggle cycles the applied theme", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const html = page.locator("html");
    const toggle = page.getByLabel(/Switch between dark and light mode/i);

    // The toggle is a 3-state cycle (system → light → dark). Step through a full
    // cycle and assert the applied data-theme reaches both light and dark, which
    // proves the toggle really switches the rendered theme.
    const applied = new Set<string>();
    applied.add((await html.getAttribute("data-theme")) ?? "");
    for (let i = 0; i < 3; i++) {
      await toggle.click();
      applied.add((await html.getAttribute("data-theme")) ?? "");
    }

    expect(applied).toContain("light");
    expect(applied).toContain("dark");
  });
});
