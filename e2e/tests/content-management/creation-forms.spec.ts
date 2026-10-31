import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

/** Last path segment of a pulp_href, e.g. the publication's UUID. */
const idFromHref = (href: string): string =>
  href.split("/").filter(Boolean).pop() ?? href;

const FILE_URL = "https://example.com/PULP_MANIFEST";
const RPM_URL = "https://example.com/repodata/repomd.xml";

/**
 * Behavioural coverage for the generic entity creation modals (EntityModal),
 * independent of the happy-path create/edit/delete flows in the per-family specs.
 * Each test pins down one real rule a user relies on:
 *   - the plain modals defer validation until submit;
 *   - reference-field pickers are restricted to compatible types.
 * Remotes create and edit on form pages, covered in `remotes/remote-create/` and
 * `remotes/remote-edit/`.
 */

test.describe("Create form — plain modal", () => {
  test("defers validation until submit, then blocks an empty required field", async ({
    repositoriesPage,
  }) => {
    await repositoriesPage.goto();
    const dialog = await repositoriesPage.openCreate();
    await repositoriesPage.selectType(dialog, "file.file");

    // Nothing typed yet → no error on open.
    await expect(dialog.getByText("Name is required")).toHaveCount(0);

    // Submitting with an empty Name surfaces the error and keeps the modal open.
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog.getByText("Name is required")).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});

test.describe("Create form — cross-entity compatibility", () => {
  test("repository remote picker lists only remotes of a compatible type", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    // Seed one File remote and one RPM remote (different plugin families).
    const fileRemote = cleanup.remote(uniqueName("remote-file"));
    await api.createRemote("file/file", { name: fileRemote, url: FILE_URL });
    const rpmRemote = cleanup.remote(uniqueName("remote-rpm"));
    await api.createRemote("rpm/rpm", { name: rpmRemote, url: RPM_URL });

    await repositoriesPage.goto();
    const dialog = await repositoriesPage.openCreate();

    await repositoriesPage.selectType(dialog, "file.file");
    let listbox = await repositoriesPage.openResourcePicker(dialog, "Remote");
    await expect(
      listbox.getByRole("option", { name: fileRemote }),
    ).toBeVisible();
    await expect(listbox.getByRole("option", { name: rpmRemote })).toHaveCount(
      0,
    );
    await repositoriesPage.closeResourcePicker(dialog, "Remote");

    // Switching the type re-filters the picker to that type's remotes.
    await repositoriesPage.selectType(dialog, "rpm.rpm");
    listbox = await repositoriesPage.openResourcePicker(dialog, "Remote");
    await expect(
      listbox.getByRole("option", { name: rpmRemote }),
    ).toBeVisible();
    await expect(listbox.getByRole("option", { name: fileRemote })).toHaveCount(
      0,
    );
    await repositoriesPage.closeResourcePicker(dialog, "Remote");
  });

  test("publication repository picker lists only repositories that can publish the type", async ({
    publicationsPage,
    cleanup,
    api,
  }) => {
    const fileRepo = cleanup.repository(uniqueName("repo-file"));
    await api.createRepository("file/file", { name: fileRepo });
    const rpmRepo = cleanup.repository(uniqueName("repo-rpm"));
    await api.createRepository("rpm/rpm", { name: rpmRepo });

    await publicationsPage.goto();
    const dialog = await publicationsPage.openCreate();

    await publicationsPage.selectType(dialog, "file.file");
    let listbox = await publicationsPage.openResourcePicker(
      dialog,
      "Repository",
    );
    await expect(listbox.getByRole("option", { name: fileRepo })).toBeVisible();
    await expect(listbox.getByRole("option", { name: rpmRepo })).toHaveCount(0);
    await publicationsPage.closeResourcePicker(dialog, "Repository");

    await publicationsPage.selectType(dialog, "rpm.rpm");
    listbox = await publicationsPage.openResourcePicker(dialog, "Repository");
    await expect(listbox.getByRole("option", { name: rpmRepo })).toBeVisible();
    await expect(listbox.getByRole("option", { name: fileRepo })).toHaveCount(
      0,
    );
    await publicationsPage.closeResourcePicker(dialog, "Repository");
  });

  test("distribution publication picker lists existing publications", async ({
    distributionsPage,
    cleanup,
    api,
  }) => {
    // The publication picker must be populated (it was previously always empty).
    const repoName = cleanup.repository(uniqueName("repo-file"));
    const repoHref = await api.createRepository("file/file", {
      name: repoName,
    });
    const pubHref = cleanup.href(
      await api.createViaTask("publications/file/file", {
        repository: repoHref,
      }),
    );
    const pubId = idFromHref(pubHref);

    await distributionsPage.goto();
    const dialog = await distributionsPage.openCreate();
    await distributionsPage.selectType(dialog, "file.file");
    const listbox = await distributionsPage.openResourcePicker(
      dialog,
      "Publication",
    );
    await expect(listbox.getByRole("option", { name: pubId })).toBeVisible();
    await distributionsPage.closeResourcePicker(dialog, "Publication");
  });
});
