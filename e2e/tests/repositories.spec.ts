import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

/**
 * Repositories are creatable with just a name for every plugin, so this is the
 * strongest proof that the generic create flow routes to each plugin's own
 * endpoint: it reads the plugin-type selector and round-trips one repo per type.
 */
test.describe("Repositories", () => {
  test("create + delete a repository for every installed plugin type", async ({
    repositoriesPage,
    cleanup,
  }) => {
    await repositoriesPage.goto();

    const types = await repositoriesPage.typeOptions();
    expect(types.length).toBeGreaterThan(1);

    for (const type of types) {
      const name = cleanup.repository(uniqueName("repo"));
      await repositoriesPage.create({ type, fields: { Name: name } });
      await repositoriesPage.expectRowVisible(name);
      await repositoriesPage.delete(name);
      await repositoriesPage.expectRowGone(name);
    }
  });

  test("edit a repository's description", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    await repositoriesPage.goto();
    const name = cleanup.repository(uniqueName("repo"));
    await repositoriesPage.create({ type: "File", fields: { Name: name } });
    await repositoriesPage.expectRowVisible(name);

    await repositoriesPage.editField(name, { Description: "updated by e2e" });
    // The row shows the description column; assert the persisted value.
    await expect(repositoriesPage.row(name)).toContainText("updated by e2e");

    await repositoriesPage.delete(name);
    await repositoriesPage.expectRowGone(name);
    void api;
  });
});
