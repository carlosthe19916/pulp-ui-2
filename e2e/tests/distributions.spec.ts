import { test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

test.describe("Distributions", () => {
  test("create + delete a file distribution", async ({
    distributionsPage,
    cleanup,
  }) => {
    await distributionsPage.goto();

    const name = cleanup.distribution(uniqueName("dist"));
    await distributionsPage.create({
      type: "File",
      fields: { Name: name, "Base Path": `e2e/${name}` },
    });

    // Distribution create is async (returns a task); reload to pick up the row.
    await distributionsPage.goto();
    await distributionsPage.expectRowVisible(name);

    await distributionsPage.delete(name);
    await distributionsPage.goto();
    await distributionsPage.expectRowGone(name);
  });
});
