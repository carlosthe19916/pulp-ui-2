import { expect, test } from "@support/fixtures";

test.describe("Workers", () => {
  test("lists an online worker and shows its component versions", async ({
    workersPage,
    api,
  }) => {
    const name = await api.onlineWorkerName();
    await workersPage.goto();

    await workersPage.filterBy("Name", name);
    const row = workersPage.row(name);
    await expect(row.getByText("Online", { exact: true })).toBeVisible();

    await workersPage.expandRow(name);
    const versions = workersPage.page.getByLabel("Component versions");
    await expect(versions.getByText("core", { exact: true })).toBeVisible();
  });
});
