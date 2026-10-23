import path from "node:path";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";
import type { ContentPage } from "./pom/ContentPage";

const data = (name: string) => path.join(__dirname, "data", name);

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

const headerAction = async (page: Page, name: string) => {
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name }).click();
};

/**
 * Uploads beyond File: each plugin's content goes through its own endpoint — the
 * synchronous `upload/` (RPM) or the async create + task (gem) — and OSTree imports an
 * archive. Every one ends in one new repository version.
 */
test.describe("Plugin uploads", () => {
  for (const { title, repositoryPath, file } of [
    {
      title: "uploads an RPM package (synchronous upload)",
      repositoryPath: "rpm/rpm",
      file: "bear-4.1-1.noarch.rpm",
    },
    {
      title: "uploads a gem (created by a task)",
      repositoryPath: "gem/gem",
      file: "panda-0.1.0.gem",
    },
  ]) {
    test(title, async ({ repositoriesPage, cleanup, api }) => {
      const name = cleanup.repository(uniqueName("repo"));
      const repositoryHref = await api.createRepository(repositoryPath, {
        name,
      });
      const page = await openRepository(repositoriesPage, name);

      await headerAction(page, "Upload content…");
      const dialog = page.getByRole("dialog", { name: /Upload content to/ });
      await dialog.locator('input[type="file"]').setInputFiles(data(file));
      await dialog.getByRole("button", { name: "Upload", exact: true }).click();

      // The async create waits for two tasks (create, then modify).
      await expect(
        page.getByText(`Version 1 of "${name}" created`),
      ).toBeVisible({ timeout: 30_000 });
      expect(await api.latestContentCount(repositoryHref)).toBe(1);
    });
  }

  test("imports an OSTree archive", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const repositoryHref = await api.createRepository("ostree/ostree", {
      name,
    });
    const page = await openRepository(repositoriesPage, name);

    await headerAction(page, "Import archive…");
    const dialog = page.getByRole("dialog", { name: /Import an archive/ });
    await dialog
      .locator('input[type="file"]')
      .setInputFiles(data("ostree-small.tar"));
    await dialog
      .getByRole("textbox", { name: "Repository name" })
      .fill("small");
    await dialog.getByRole("button", { name: "Import", exact: true }).click();

    await expect(page.getByText(`Version 1 of "${name}" created`)).toBeVisible({
      timeout: 30_000,
    });
    expect(await api.latestContentCount(repositoryHref)).toBeGreaterThan(0);
  });
});
