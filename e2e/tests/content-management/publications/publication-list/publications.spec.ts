import { expect, test } from "../../../fixtures";
import { uniqueName } from "../../../helpers/unique";

/**
 * Publications are immutable (create-only, no edit) and are created against an
 * existing repository via a typeahead picker.
 */
test.describe("Publications", () => {
  test("list renders and the create modal offers a repository", async ({
    publicationsPage,
  }) => {
    await publicationsPage.goto();

    const dialog = await publicationsPage.openCreate();
    await expect(dialog.getByText("Repository", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  });

  test("create a publication for a file repository", async ({
    publicationsPage,
    cleanup,
    api,
  }) => {
    // Seed a file repository to publish from.
    const repoName = cleanup.repository(uniqueName("repo-file"));
    const repoHref = await api.createRepository("file/file", {
      name: repoName,
    });

    await publicationsPage.goto();
    const dialog = await publicationsPage.openCreate();
    // Pick File so the create routes to publications/file/file, then the repo.
    await publicationsPage.selectType(dialog, "file.file");
    await publicationsPage.selectResource(dialog, "Repository", repoName);
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog).toBeHidden();

    // Publication create is async; poll the backend for the new record, register
    // it for cleanup (publications have no name), and assert its row renders.
    await expect
      .poll(() =>
        api.publicationHrefsForRepository(repoHref).then((h) => h.length),
      )
      .toBeGreaterThan(0);
    const [pubHref] = await api.publicationHrefsForRepository(repoHref);
    cleanup.href(pubHref);

    const pubId = pubHref.split("/").filter(Boolean).pop() ?? pubHref;
    await publicationsPage.goto();
    await publicationsPage.expectRowVisible(pubId);
  });
});
