import { test, expect } from "@playwright/test";

import { E2E_PASSWORD, E2E_USERNAME } from "./helpers/auth";

test.describe("Login page", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("textbox", { name: /username/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("logs in with valid credentials and reaches the dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("textbox", { name: /username/i }).fill(E2E_USERNAME);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();
  });
});
