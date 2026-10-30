import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

/**
 * Repositories are creatable with just a name for every plugin, so this is the
 * strongest proof that the generic create flow routes to each plugin's own
 * endpoint: it reads the plugin-type selector and round-trips one repo per type.
 */
test.describe("Repositories", () => {
  test("create + delete a repository for every installed plugin type", async ({
    repositoriesPage,
    cleanup,
    api,
  }) => {
    // One full create+delete round-trip per installed plugin type (a dozen-plus on
    // a fully-loaded backend). Each async delete waits out its task plus a ~5s
    // task-status poll, so the whole loop needs well past the default 30s budget.
    test.setTimeout(240_000);
    await repositoriesPage.goto();

    const types = await repositoriesPage.typeOptions();
    expect(types.length).toBeGreaterThan(1);

    for (const type of types) {
      const name = cleanup.repository(uniqueName("repo"));
      await repositoriesPage.create({ type, fields: { Name: name } });
      await repositoriesPage.filterBy("Name", name);
      await repositoriesPage.expectRowVisible(name);
      await repositoriesPage.delete(name);
      // The delete is async (202 + task); under load the task can outlast the row's
      // 15s UI wait. Confirm the server-side delete first, so expectRowGone only has
      // to wait for the list's next task-status poll to catch up, not for the task.
      await expect
        .poll(() => api.repositoryExists(name), { timeout: 60_000 })
        .toBe(false);
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
    await repositoriesPage.create({
      type: "file.file",
      fields: { Name: name },
    });
    await repositoriesPage.filterBy("Name", name);
    await repositoriesPage.expectRowVisible(name);

    await repositoriesPage.editField(name, { Description: "updated by e2e" });
    // The row shows the description column; assert the persisted value.
    await expect(repositoriesPage.row(name)).toContainText("updated by e2e");

    await repositoriesPage.delete(name);
    await repositoriesPage.expectRowGone(name);
    void api;
  });
});
