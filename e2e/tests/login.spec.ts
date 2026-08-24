import { test, expect } from "@playwright/test";

import { E2E_PASSWORD, E2E_USERNAME } from "./helpers/auth";

test.describe("Login page", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /log in to your account/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /username/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /^password$/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /^help$/i })).toBeVisible();
    await expect(page.getByText(/http basic authentication/i)).toBeVisible();
    await expect(page.locator(".pf-v6-c-background-image")).toBeAttached();
  });

  test("logs in with valid credentials and reaches the dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("textbox", { name: /username/i }).fill(E2E_USERNAME);
    await page.getByRole("textbox", { name: /^password$/i }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();
  });

  test("rejects invalid credentials and stays on /login", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("textbox", { name: /username/i }).fill(E2E_USERNAME);
    await page
      .getByRole("textbox", { name: /^password$/i })
      .fill("not-the-password");
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
  });
});
