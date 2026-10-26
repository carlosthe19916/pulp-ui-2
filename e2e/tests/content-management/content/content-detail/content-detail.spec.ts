import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

/**
 * Content-side writes from a content unit's detail page: add the unit to a
 * repository and remove it again.
 */
test.describe("Content writes", () => {
  test("adds a unit to a repository and removes it again", async ({
    page,
    cleanup,
    api,
  }) => {
    const repository = cleanup.repository(uniqueName("repo"));
    await api.createFileRepository(repository);
    const contentHref = await api.createFileContent(
      `${uniqueName("unit")}.txt`,
    );
    const id = contentHref.split("/").filter(Boolean).pop() ?? "";
    await page.goto(`/content-management/default/content/file.file/${id}`);

    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add to repository…" }).click();
    const dialog = page.getByRole("dialog", { name: /Add 1 unit/ });
    await dialog.getByRole("button", { name: "Repository" }).click();
    await page
      .getByRole("textbox", { name: "Repository filter" })
      .fill(repository);
    await page.getByRole("option", { name: repository }).click();
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      page.getByText(`Version 1 of "${repository}" created`),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Repositories" }).click();
    const row = page.getByRole("row", { name: new RegExp(repository) });
    await row.getByRole("button", { name: "Kebab toggle" }).click();
    await page
      .getByRole("menuitem", { name: "Remove from this repository" })
      .click();
    await page
      .getByRole("dialog", { name: /Remove 1 unit from/ })
      .getByRole("button", { name: "Remove", exact: true })
      .click();
    await expect(
      page.getByText(`Version 2 of "${repository}" created`),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Not in any repository" }),
    ).toBeVisible();
  });
});
