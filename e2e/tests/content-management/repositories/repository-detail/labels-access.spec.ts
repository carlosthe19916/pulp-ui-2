import type { Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";
import type { ContentPage } from "@support/pom/ContentPage";

const openRepository = async (
  repositoriesPage: ContentPage,
  name: string,
): Promise<Page> => {
  await repositoriesPage.goto();
  await repositoriesPage.filterBy("Name", name);
  await repositoriesPage.row(name).getByRole("link", { name }).click();
  const page = repositoriesPage.page;
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  return page;
};

test.describe("Repository labels and access", () => {
  test("adds and removes a label", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    await api.createFileRepository(name);
    const page = await openRepository(repositoriesPage, name);

    await page.getByText("Edit labels", { exact: true }).click();
    const addDialog = page.getByRole("dialog", { name: "Edit labels" });
    await addDialog
      .getByRole("textbox", { name: "Add label" })
      .fill("stage=prod");
    await addDialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(addDialog.getByText("stage=prod")).toBeVisible();
    await addDialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("1 label updated")).toBeVisible();
    await expect(page.getByText("stage=prod")).toBeVisible();

    await page.getByText("Edit labels", { exact: true }).click();
    const removeDialog = page.getByRole("dialog", { name: "Edit labels" });
    await removeDialog
      .getByRole("button", { name: "Remove label stage" })
      .click();
    await removeDialog
      .getByRole("button", { name: "Save", exact: true })
      .click();
    await expect(page.getByText("1 label updated")).toBeVisible();
    await expect(page.getByText("stage=prod")).toHaveCount(0);
  });

  test("grants and revokes a role on the repository", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    // A user of its own: searching "admin" can match other tests' users and page it out.
    const username = cleanup.user(uniqueName("grantee"));
    await Promise.all([
      api.createFileRepository(name),
      api.createUser({ username }),
    ]);
    const page = await openRepository(repositoriesPage, name);

    await page.getByRole("tab", { name: "Access" }).click();
    await page.getByRole("button", { name: "Add role" }).click();
    const dialog = page.getByRole("dialog");
    // Each picker's options come from a debounced server-side search. Wait for the
    // listbox to open before typing (filling while it is still opening drops the
    // keystrokes, so the search never runs), then wait generously for the option —
    // the fetch can land after the default 5s on a busy backend.
    await dialog.getByRole("button", { name: "Role", exact: true }).click();
    await page.getByRole("listbox").waitFor({ state: "visible" });
    await page.getByRole("textbox", { name: "Role filter" }).fill("viewer");
    const role = page
      .getByRole("option")
      .filter({ hasText: "file.filerepository_viewer" });
    await expect(role).toHaveCount(1, { timeout: 15_000 });
    await role.click();
    await dialog.getByRole("button", { name: "Users", exact: true }).click();
    await page.getByRole("listbox").waitFor({ state: "visible" });
    await page.getByRole("textbox", { name: "Users filter" }).fill(username);
    const user = page.getByRole("option", { name: username, exact: true });
    await expect(user).toHaveCount(1, { timeout: 15_000 });
    await user.click();
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      page.getByText('Role "file.filerepository_viewer" granted'),
    ).toBeVisible();

    const roles = page.getByRole("grid", { name: "Object roles" });
    await expect(roles.getByText("file.filerepository_viewer")).toBeVisible();
    await roles
      .getByRole("button", {
        name: `Remove ${username} from file.filerepository_viewer`,
      })
      .click();
    await expect(page.getByText(`Removed "${username}"`)).toBeVisible();
  });
});
