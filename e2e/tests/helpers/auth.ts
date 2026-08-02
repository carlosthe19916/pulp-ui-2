import { expect, type Page } from "@playwright/test";

export const E2E_USERNAME = process.env.E2E_USERNAME ?? "admin";
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "password";

/** Log in via the UI and wait for the authenticated dashboard. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /username/i }).fill(E2E_USERNAME);
  await page.getByLabel(/password/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
}
