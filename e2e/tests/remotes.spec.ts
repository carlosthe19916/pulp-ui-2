import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

const FILE_URL = "https://fixtures.pulpproject.org/file/PULP_MANIFEST";
const FILE_URL_2 = "https://fixtures.pulpproject.org/file2/PULP_MANIFEST";

test.describe("Remotes", () => {
  test("create, edit, and delete a file remote", async ({
    remotesPage,
    cleanup,
  }) => {
    await remotesPage.goto();

    const name = cleanup.remote(uniqueName("remote"));
    await remotesPage.create({
      type: "File",
      fields: { Name: name, URL: FILE_URL },
    });
    await remotesPage.expectRowVisible(name);
    await expect(remotesPage.row(name)).toContainText(FILE_URL);

    await remotesPage.editField(name, { URL: FILE_URL_2 });
    await expect(remotesPage.row(name)).toContainText(FILE_URL_2);

    await remotesPage.delete(name);
    await remotesPage.expectRowGone(name);
  });

  test("create modal offers every installed remote plugin type", async ({
    remotesPage,
  }) => {
    await remotesPage.goto();
    const types = await remotesPage.typeOptions();
    expect(types).toContain("File");
    // Multiple plugins are installed in the dev/e2e backend.
    expect(types.length).toBeGreaterThan(1);
  });

  test("create remote is a multi-step wizard with grouped fields", async ({
    remotesPage,
    page,
  }) => {
    await remotesPage.goto();
    const dialog = await remotesPage.openCreate();

    // The large remote form is a wizard: grouped steps + Back/Next footer.
    await expect(
      dialog.getByRole("button", { name: "Next", exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Back", exact: true }),
    ).toBeDisabled();
    // Step 1 (General) holds the required fields.
    await expect(dialog.getByRole("combobox", { name: "Type" })).toBeVisible();
    await expect(
      dialog.getByRole("textbox", { name: "Name", exact: true }),
    ).toBeVisible();

    // Advancing enables Back; a later step exposes an authentication field.
    await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("x");
    await dialog.getByRole("textbox", { name: "URL", exact: true }).fill("x");
    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: "Back", exact: true }),
    ).toBeEnabled();

    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
    void page;
  });

  test("create a container remote with its required upstream_name", async ({
    remotesPage,
    cleanup,
  }) => {
    await remotesPage.goto();
    const name = cleanup.remote(uniqueName("remote"));
    await remotesPage.create({
      type: "Container",
      fields: {
        Name: name,
        URL: "https://registry-1.docker.io",
        "Upstream Name": "library/busybox",
      },
    });
    await remotesPage.expectRowVisible(name);
    await expect(remotesPage.row(name)).toContainText("Container");

    await remotesPage.delete(name);
    await remotesPage.expectRowGone(name);
  });
});
