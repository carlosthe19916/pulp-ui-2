import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

/** Last path segment of a pulp_href, e.g. the publication's UUID. */
const idFromHref = (href: string): string =>
  href.split("/").filter(Boolean).pop() ?? href;

const FILE_URL = "https://example.com/PULP_MANIFEST";
const RPM_URL = "https://example.com/repodata/repomd.xml";

/**
 * Behavioural coverage for the generic entity creation forms (EntityModal /
 * EntityWizard), independent of the happy-path create/edit/delete flows in the
 * per-family specs. Each test pins down one real rule a user relies on:
 *   - the multi-step Remote wizard gates navigation and defers validation;
 *   - the plain modals defer validation until submit;
 *   - reference-field pickers are restricted to compatible types.
 */

test.describe("Create form — Remote wizard", () => {
  test("opens without showing validation errors", async ({ remotesPage }) => {
    await remotesPage.goto();
    const dialog = await remotesPage.openCreate();
    await remotesPage.selectType(dialog, "file.file");

    // Required fields are empty, but a freshly opened form must not show errors.
    await expect(dialog.getByText(/is required/)).toHaveCount(0);
  });

  test("disables Next until the required first step is complete", async ({
    remotesPage,
  }) => {
    await remotesPage.goto();
    const dialog = await remotesPage.openCreate();
    await remotesPage.selectType(dialog, "file.file");
    const next = dialog.getByRole("button", { name: "Next", exact: true });

    await expect(next).toBeDisabled();
    // Only Name filled — URL is still required, so Next stays disabled.
    await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("x");
    await expect(next).toBeDisabled();
    // Both required fields present — Next unlocks.
    await dialog
      .getByRole("textbox", { name: "URL", exact: true })
      .fill(FILE_URL);
    await expect(next).toBeEnabled();
  });

  test("keeps later steps locked until the first step is valid, then allows jumping", async ({
    remotesPage,
  }) => {
    await remotesPage.goto();
    const dialog = await remotesPage.openCreate();
    await remotesPage.selectType(dialog, "file.file");

    const authStep = dialog.getByRole("button", { name: "Authentication" });
    const timeoutsStep = dialog.getByRole("button", { name: "Timeouts" });
    await expect(authStep).toBeDisabled();
    await expect(timeoutsStep).toBeDisabled();

    await dialog
      .getByRole("textbox", { name: "Name", exact: true })
      .fill(uniqueName("remote"));
    await dialog
      .getByRole("textbox", { name: "URL", exact: true })
      .fill(FILE_URL);

    await expect(authStep).toBeEnabled();
    await expect(timeoutsStep).toBeEnabled();

    // Jump straight to a later step via the nav rail (not sequentially).
    await timeoutsStep.click();
    await expect(
      dialog.getByRole("spinbutton", { name: "Total Timeout", exact: true }),
    ).toBeVisible();
  });

  test("preserves entered values when navigating between steps", async ({
    remotesPage,
  }) => {
    await remotesPage.goto();
    const dialog = await remotesPage.openCreate();
    await remotesPage.selectType(dialog, "file.file");

    const name = uniqueName("remote");
    await dialog.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await dialog
      .getByRole("textbox", { name: "URL", exact: true })
      .fill(FILE_URL);

    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    await dialog
      .getByRole("textbox", { name: "Username", exact: true })
      .fill("sync-user");

    // Back to General: the first step's values survived the step unmount.
    await dialog.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      dialog.getByRole("textbox", { name: "Name", exact: true }),
    ).toHaveValue(name);

    // Forward again: the second step's value survived too.
    await dialog.getByRole("button", { name: "Authentication" }).click();
    await expect(
      dialog.getByRole("textbox", { name: "Username", exact: true }),
    ).toHaveValue("sync-user");
  });

  test("renders a single close control", async ({ remotesPage }) => {
    await remotesPage.goto();
    const dialog = await remotesPage.openCreate();
    // Regression guard: previously the Modal's close button doubled the header's.
    await expect(dialog.getByRole("button", { name: "Close" })).toHaveCount(1);
  });
});

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
