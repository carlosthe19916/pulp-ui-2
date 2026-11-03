import { expect, test } from "@support/fixtures";

test.describe("Dashboard", () => {
  test("opens on the default domain with the instance and domain sections", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard\/default$/);

    await expect(
      page.getByRole("heading", { level: 2, name: "Pulp instance" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "System health" }),
    ).toBeVisible();
    await expect(page.getByText("All services are running")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "Task activity" }),
    ).toBeVisible();
  });
});
