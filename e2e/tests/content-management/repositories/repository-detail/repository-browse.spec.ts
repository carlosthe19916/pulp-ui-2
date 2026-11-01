import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

/**
 * A repository's Content tab shows its latest version as "Browse" (the plugin's own view, here
 * File's path browser over `content/file/files/?relative_path__startswith=`) next to
 * "All content" (the generic list). Clicking a row opens the unit in the side drawer.
 */
test.describe("Repository browse", () => {
  test("browses a File repository by folder and opens a file", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.repository(uniqueName("repo"));
    const repository = await api.createFileRepository(name);
    await api.addFileContent(repository.pulp_href, "README.txt");
    await api.addFileContent(repository.pulp_href, "docs/guide/intro.txt");

    await repositoriesPage.goto();
    await repositoriesPage.filterBy("Name", name);
    await repositoriesPage.row(name).getByRole("link", { name }).click();
    const page = repositoriesPage.page;

    // Details is an overview: its content count opens the Content tab.
    await page
      .getByRole("main")
      .getByRole("button", { name: "2 units", exact: true })
      .click();
    await expect(
      page.getByRole("tab", { name: "Content (2)" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "Browse" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const files = page.getByRole("grid", { name: "Files" });
    await expect(files.getByRole("row")).toHaveCount(3); // header + 2 files

    // Folders narrow the list server-side by path prefix.
    await files.getByRole("button", { name: "docs" }).click();
    await expect(files.getByRole("row")).toHaveCount(2);
    await expect(files).toContainText("intro.txt");
    await expect(files).not.toContainText("README.txt");

    await files.getByRole("row", { name: /intro\.txt/ }).click();
    await expect(page.locator(".pf-v6-c-drawer__panel")).toContainText(
      "intro.txt",
    );

    // The generic list is still one tab away.
    await page.getByRole("tab", { name: "All content" }).click();
    await expect(
      page.getByRole("list", { name: "Content list" }),
    ).toBeVisible();
  });
});
