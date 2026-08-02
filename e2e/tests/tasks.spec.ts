import { test, expect } from "@playwright/test";

test.describe("Tasks page", () => {
  test("renders tasks heading and table (empty or with rows)", async ({
    page,
  }) => {
    await page.goto("/tasks");

    await expect(page.getByRole("heading", { name: /tasks/i })).toBeVisible();
    await expect(
      page.getByRole("table", { name: /tasks table/i }),
    ).toBeVisible();
  });
});
