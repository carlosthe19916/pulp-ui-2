import { test, expect } from "@playwright/test";

test.describe("Repositories page", () => {
  test("renders repositories table", async ({ page }) => {
    const repositoriesResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v3/repositories/") &&
        response.request().method() === "GET",
    );

    await page.goto("/repositories");

    const response = await repositoriesResponse;
    expect(response.request().headers()["authorization"]).toMatch(/^basic /i);
    expect(response.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /repositories/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("grid", { name: /repositories table/i }),
    ).toBeVisible();
  });
});
