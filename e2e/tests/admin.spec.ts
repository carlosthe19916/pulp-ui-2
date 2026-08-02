import { test, expect } from "@playwright/test";

test.describe("Admin users page", () => {
  test("renders users table", async ({ page }) => {
    await page.goto("/admin/users");

    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
    await expect(
      page.getByRole("table", { name: /users table/i }),
    ).toBeVisible();
  });
});
