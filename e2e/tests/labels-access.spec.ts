import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";
import type { ContentPage } from "./pom/ContentPage";

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

    await page.getByText("Add label", { exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add label" });
    await dialog.getByLabel("Key").fill("stage");
    await dialog.getByLabel("Value").fill("prod");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText('Label "stage" saved')).toBeVisible();
    await expect(page.getByText("stage: prod")).toBeVisible();

    await page.getByRole("button", { name: "Remove label stage" }).click();
    await expect(page.getByText('Label "stage" removed')).toBeVisible();
    await expect(page.getByText("stage: prod")).toHaveCount(0);
  });

  test("grants and revokes a role on the repository", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    await api.createFileRepository(name);
    const page = await openRepository(repositoriesPage, name);

    await page.getByRole("tab", { name: "Access" }).click();
    await page.getByRole("button", { name: "Add role" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Role", exact: true }).click();
    await page.getByRole("textbox", { name: "Role filter" }).fill("viewer");
    const role = page
      .getByRole("option")
      .filter({ hasText: "file.filerepository_viewer" });
    await expect(role).toHaveCount(1);
    await role.click();
    await dialog.getByRole("button", { name: "Users", exact: true }).click();
    await page.getByRole("textbox", { name: "Users filter" }).fill("admin");
    const user = page.getByRole("option").filter({ hasText: /^admin$/ });
    await expect(user).toHaveCount(1);
    await user.click();
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      page.getByText('Role "file.filerepository_viewer" granted'),
    ).toBeVisible();

    const roles = page.getByRole("grid", { name: "Object roles" });
    await expect(roles.getByText("file.filerepository_viewer")).toBeVisible();
    await roles
      .getByRole("button", {
        name: "Remove admin from file.filerepository_viewer",
      })
      .click();
    await expect(page.getByText('Removed "admin"')).toBeVisible();
  });
});
