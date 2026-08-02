import { test, expect } from "@playwright/test";

test.describe("Repositories page", () => {
  test("renders repositories table", async ({ page }) => {
    await page.goto("/repositories");

    await expect(
      page.getByRole("heading", { name: /repositories/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /repositories table/i }),
    ).toBeVisible();
  });
});
