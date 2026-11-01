import type { Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";
import { expectVersionCreated } from "@support/helpers/repositoryVersion";
import { mockInFlightTask } from "@support/helpers/taskMock";
import { uniqueName } from "@support/helpers/unique";
import type { ContentPage } from "@support/pom/ContentPage";

/** Opens a repository's detail page from the list, on its Content tab. */
const openRepository = async (
  repositoriesPage: ContentPage,
  name: string,
): Promise<Page> => {
  await repositoriesPage.goto();
  await repositoriesPage.filterBy("Name", name);
  await repositoriesPage.row(name).getByRole("link", { name }).click();
  const page = repositoriesPage.page;
  await page.getByRole("tab", { name: /^Content/ }).click();
  return page;
};

const headerAction = async (page: Page, name: string) => {
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name }).click();
};

/** A text file for the upload drop zone's file input. */
const textFile = (name: string) => ({
  name,
  mimeType: "text/plain",
  buffer: Buffer.from(`e2e upload ${name} ${Date.now()}\n`),
});

/**
 * Content changes on a repository: every one creates a new version, the outcome toast
 * names it, and the Content tab refreshes. Seeded through the API; File only.
 */
test.describe("Repository content writes", () => {
  test("removes selected files from Browse", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const repository = await api.createFileRepository(name);
    for (const path of ["a.txt", "b.txt", "c.txt"]) {
      await api.addFileContent(repository.pulp_href, path);
    }
    const page = await openRepository(repositoriesPage, name);

    const files = page.getByRole("grid", { name: "Files" });
    await files
      .getByRole("row", { name: /a\.txt/ })
      .getByRole("checkbox")
      .check();
    await files
      .getByRole("row", { name: /b\.txt/ })
      .getByRole("checkbox")
      .check();
    await expect(page.getByText("2 selected")).toBeVisible();
    await page.getByRole("button", { name: "Remove", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: /Remove 2 units/ });
    await expect(dialog).toContainText("a.txt");
    await dialog.getByRole("button", { name: "Remove", exact: true }).click();

    await expectVersionCreated(page, name, 4);
    await expect(files.getByRole("row")).toHaveCount(2); // header + c.txt
    expect(await api.latestFilePaths(repository.pulp_href)).toEqual(["c.txt"]);
  });

  test("removes all content after typing the repository name", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const repository = await api.createFileRepository(name);
    await api.addFileContent(repository.pulp_href, "a.txt");
    const page = await openRepository(repositoriesPage, name);

    await headerAction(page, "Remove all content…");
    const dialog = page.getByRole("dialog", { name: /Remove all content/ });
    const confirm = dialog.getByRole("button", { name: "Remove all" });
    await expect(confirm).toBeDisabled();
    await dialog.getByRole("textbox").fill(name);
    await confirm.click();

    await expectVersionCreated(page, name, 2);
    await expect(page.getByText(`No content in "${name}" yet`)).toBeVisible();
    expect(await api.latestFilePaths(repository.pulp_href)).toEqual([]);
  });

  test("adds the content another repository has and this one misses", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const target = cleanup.repository(uniqueName("target"));
    const source = cleanup.repository(uniqueName("source"));
    const targetRepository = await api.createFileRepository(target);
    const sourceRepository = await api.createFileRepository(source);
    // Same path and bytes → the same content unit in both repositories.
    await api.addFileContent(targetRepository.pulp_href, "shared.txt");
    await api.addFileContent(sourceRepository.pulp_href, "shared.txt");
    await api.addFileContent(sourceRepository.pulp_href, "extra.txt");
    const page = await openRepository(repositoriesPage, target);

    await headerAction(page, "Add content…");
    const dialog = page.getByRole("dialog", { name: /Add content to/ });
    await dialog.getByRole("tab", { name: "From another repository" }).click();
    await dialog.getByRole("button", { name: "Source repository" }).click();
    await page.getByRole("option", { name: source }).click();

    const list = dialog.getByRole("grid", { name: "Content to add" });
    await expect(list.getByRole("row")).toHaveCount(2); // header + extra.txt
    await list
      .getByRole("row", { name: /extra\.txt/ })
      .getByRole("checkbox")
      .check();
    await dialog.getByRole("button", { name: "Add 1 unit" }).click();

    await expectVersionCreated(page, target, 2);
    expect(await api.latestFilePaths(targetRepository.pulp_href)).toEqual([
      "extra.txt",
      "shared.txt",
    ]);
  });

  test("uploads several files as one new version", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const repository = await api.createFileRepository(name);
    const page = await openRepository(repositoriesPage, name);

    await headerAction(page, "Upload content…");
    const dialog = page.getByRole("dialog", { name: /Upload content to/ });
    await dialog
      .locator('input[type="file"]')
      .setInputFiles([textFile("one.txt"), textFile("two.txt")]);
    await dialog.getByRole("button", { name: "Upload", exact: true }).click();

    await expectVersionCreated(page, name, 1);
    expect(await api.latestVersionNumber(repository.pulp_href)).toBe(1);
    expect(await api.latestFilePaths(repository.pulp_href)).toEqual([
      "one.txt",
      "two.txt",
    ]);
  });

  test("pauses before adding when an upload fails", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const repository = await api.createFileRepository(name);
    const page = await openRepository(repositoriesPage, name);

    // Fail the second upload request only.
    let uploads = 0;
    await page.route(/\/content\/file\/files\/upload\/$/, (route) =>
      ++uploads === 2
        ? route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ file: ["Invalid file."] }),
          })
        : route.continue(),
    );

    await headerAction(page, "Upload content…");
    const dialog = page.getByRole("dialog", { name: /Upload content to/ });
    await dialog
      .locator('input[type="file"]')
      .setInputFiles([textFile("ok.txt"), textFile("bad.txt")]);
    await dialog.getByRole("button", { name: "Upload", exact: true }).click();

    await expect(
      dialog.getByText("1 of 2 files are ready. 1 failed."),
    ).toBeVisible();
    expect(await api.latestVersionNumber(repository.pulp_href)).toBe(0);
    await dialog.getByRole("button", { name: `Add 1 to "${name}"` }).click();

    await expectVersionCreated(page, name, 1);
    expect(await api.latestFilePaths(repository.pulp_href)).toEqual(["ok.txt"]);
  });

  test("pauses content changes while a task runs on the repository", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const repository = await api.createFileRepository(name);
    await api.addFileContent(repository.pulp_href, "a.txt");
    await mockInFlightTask(repositoriesPage.page, repository.prn, "modify");
    const page = await openRepository(repositoriesPage, name);

    await expect(page.getByText("Creating a new version…")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Remove", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await expect(
      page.getByRole("menuitem", { name: "Add content…" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  test("restores an older version as the latest", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const repository = await api.createFileRepository(name);
    await api.addFileContent(repository.pulp_href, "a.txt");
    await api.addFileContent(repository.pulp_href, "b.txt");
    const page = await openRepository(repositoriesPage, name);

    await page.getByRole("tab", { name: /Versions/ }).click();
    await page.getByRole("link", { name: "Version 1", exact: true }).click();
    await expect(page.getByText("Older version")).toBeVisible();

    await headerAction(page, "Restore as latest");
    await page
      .getByRole("dialog", { name: /Restore version 1/ })
      .getByRole("button", { name: "Restore", exact: true })
      .click();

    await expectVersionCreated(page, name, 3);
    expect(await api.latestFilePaths(repository.pulp_href)).toEqual(["a.txt"]);
  });
});
