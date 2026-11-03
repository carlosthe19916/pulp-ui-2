import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

test.describe("Task drawer", () => {
  test("lists a task this browser started until it is cleared", async ({
    page,
    api,
    cleanup,
    repositoriesPage,
  }) => {
    const name = cleanup.repository(uniqueName("drawer-repo"));
    await api.createFileRepository(name);

    // Deleting a repository answers 202 with a task: the drawer follows it.
    await repositoriesPage.goto();
    await repositoriesPage.filterBy("Name", name);
    await repositoriesPage.delete(name);
    await repositoriesPage.expectRowGone(name);

    const openDrawer = () =>
      page.getByRole("button", { name: /^Tasks(, \d+ running)?$/ }).click();
    const item = page
      .getByRole("list", { name: "Tasks" })
      .getByRole("listitem")
      .filter({ hasText: `Repository "${name}" deletion started` });

    await openDrawer();
    await expect(item.getByText("completed", { exact: true })).toBeVisible({
      timeout: 15_000,
    });

    // Kept across a reload.
    await page.reload();
    await openDrawer();
    await expect(item.getByText("completed", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Clear finished" }).click();
    await expect(item).toBeHidden();
  });
});
