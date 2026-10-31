import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

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
    await remotesPage.filterBy("Name", name);
    await remotesPage.expectRowVisible(name);
    await expect(remotesPage.row(name)).toContainText(FILE_URL);

    await remotesPage.editField(name, { URL: FILE_URL_2 });
    await expect(remotesPage.row(name)).toContainText(FILE_URL_2);

    await remotesPage.delete(name);
    await remotesPage.expectRowGone(name);
  });

  test("create page offers every installed remote plugin type", async ({
    remotesPage,
  }) => {
    await remotesPage.goto();
    const types = await remotesPage.typeOptions();
    expect(types).toContain("File");
    // Multiple plugins are installed in the dev/e2e backend.
    expect(types.length).toBeGreaterThan(1);
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
        "Upstream name": "library/busybox",
      },
    });
    await remotesPage.filterBy("Name", name);
    await remotesPage.expectRowVisible(name);
    await expect(remotesPage.row(name)).toContainText("container.container");

    await remotesPage.delete(name);
    await remotesPage.expectRowGone(name);
  });
});
