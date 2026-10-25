import { expect, test } from "../../../fixtures";
import { uniqueName } from "../../../helpers/unique";

test.describe("Distributions", () => {
  test("create + delete a file distribution", async ({
    distributionsPage,
    cleanup,
  }) => {
    await distributionsPage.goto();

    const name = cleanup.distribution(uniqueName("dist"));
    await distributionsPage.create({
      type: "file.file",
      fields: { Name: name, "Base Path": `e2e/${name}` },
    });

    // Distribution create is async (returns a task); reload to pick up the row.
    await distributionsPage.goto();
    await distributionsPage.filterBy("Name", name);
    await distributionsPage.expectRowVisible(name);

    await distributionsPage.delete(name);
    await distributionsPage.goto();
    await distributionsPage.filterBy("Name", name);
    await distributionsPage.expectRowGone(name);
  });

  test("edit a distribution's base path", async ({
    distributionsPage,
    cleanup,
    api,
  }) => {
    // Seed the distribution via the API (create is async); the UI only edits it.
    const name = cleanup.distribution(uniqueName("dist"));
    await api.createViaTask("distributions/file/file", {
      name,
      base_path: `e2e/${name}`,
    });

    await distributionsPage.goto();
    await distributionsPage.filterBy("Name", name);
    await distributionsPage.expectRowVisible(name);

    const newPath = `e2e/${name}-edited`;
    await distributionsPage.editField(name, { "Base Path": newPath });

    // Distribution update is synchronous, so the row reflects the new base path.
    await expect(distributionsPage.row(name)).toContainText(newPath);
  });
});
