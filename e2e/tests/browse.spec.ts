import { test, expect } from "@playwright/test";

test.describe("Browse page", () => {
  test("renders browse content page without login", async ({ page }) => {
    await page.goto("/browse");

    await expect(
      page.getByRole("heading", { name: /browse content/i }),
    ).toBeVisible();
  });
});
