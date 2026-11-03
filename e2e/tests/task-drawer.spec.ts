import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

test.describe("Task drawer", () => {
  test("lists a content change this browser started until it is cleared", async ({
    page,
    api,
    cleanup,
    repositoriesPage,
  }) => {
    const name = cleanup.repository(uniqueName("drawer-repo"));
    const repository = await api.createFileRepository(name);
    await api.addFileContent(repository.pulp_href, "a.txt");

    // A content change starts a task, which the drawer follows.
    await repositoriesPage.goto();
    await repositoriesPage.filterBy("Name", name);
    await repositoriesPage.row(name).getByRole("link", { name }).click();
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Remove all content…" }).click();
    const dialog = page.getByRole("dialog", { name: /Remove all content/ });
    await dialog.getByRole("textbox").fill(name);
    await dialog.getByRole("button", { name: "Remove all" }).click();

    const openDrawer = () =>
      page.getByRole("button", { name: /^Tasks(, \d+ running)?$/ }).click();
    const item = page
      .getByRole("list", { name: "Tasks" })
      .getByRole("listitem")
      .filter({ hasText: `Removing all content from "${name}"` });

    await openDrawer();
    await expect(item.getByText("completed", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      item.getByRole("link", { name: "Version 2 created" }),
    ).toBeVisible();

    // Kept across a reload.
    await page.reload();
    await openDrawer();
    await expect(item.getByText("completed", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Clear finished" }).click();
    await expect(item).toBeHidden();
  });
});
