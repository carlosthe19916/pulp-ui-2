import { expect, test } from "@support/fixtures";
import {
  editPath,
  fileDistribution,
  pickResource,
  seedDistribution,
  seedPublication,
  seedRepository,
} from "@support/helpers/distributions";

// Scenarios: e2e/specs/distributions.md (edit).

test.describe("Distribution edit page", () => {
  /**
   * DST-EDT-01 · Switching the source clears the old one
   *
   * Summary: Changing a distribution's source to another kind stops serving the old source.
   *
   * Seed: a file distribution serving a publication
   *
   * When I open its edit page, choose "Repository" as the source, pick a repository and save
   * Then the toast "Distribution "<name>" update started" appears and the detail page opens
   * And once the task finishes, the server has the repository set and no publication
   *
   * Pulp refuses a distribution with both a repository and a publication, so the save must clear the
   * old source.
   */
  test(
    "Changing a distribution's source to another kind stops serving the old source.",
    {
      tag: "@DST-EDT-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-EDT-01",
      },
    },
    async ({ formPage, toasts, api, cleanup, page }) => {
      const repository = await seedRepository(api, cleanup);
      const publication = await seedPublication(
        api,
        cleanup,
        `${repository.href}versions/0/`,
      );
      const { name, href } = await seedDistribution(api, cleanup, {
        publication,
      });

      await formPage.goto(editPath(href));
      await expect(formPage.heading("Edit file distribution")).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Publication", exact: true }),
      ).toBeChecked();
      await page
        .getByRole("radio", { name: "Repository", exact: true })
        .check();
      await pickResource(page, {
        label: "Repository",
        filter: repository.name,
        option: repository.name,
      });
      await formPage.submit("Save");

      await expect(
        toasts.info(`Distribution "${name}" update started`),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect
        .poll(async () => {
          const record = await fileDistribution(api, name);
          return [record?.repository, record?.publication];
        })
        .toEqual([repository.href, null]);
    },
  );

  /**
   * DST-EDT-02 · Rename the base path
   *
   * Summary: Editing a distribution's base path moves where its content is served.
   *
   * Seed: a file distribution with base path "files/old"
   *
   * When I change its base path to "files/new" and save
   * Then its detail page shows the base path "files/new" once the update task finishes
   */
  test(
    "Editing a distribution's base path moves where its content is served.",
    {
      tag: "@DST-EDT-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-EDT-02",
      },
    },
    async ({ formPage, api, cleanup, page }) => {
      const { name, href, basePath } = await seedDistribution(api, cleanup);
      const moved = `${basePath}-moved`;

      await formPage.goto(editPath(href));
      await formPage.fill({ "Base path": moved });
      await formPage.submit("Save");

      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect
        .poll(async () => (await fileDistribution(api, name))?.base_path)
        .toBe(moved);
      // The detail page reads the distribution again once its update task settles.
      await expect(
        page.getByRole("link", { name: new RegExp(`/${moved}/$`) }),
      ).toBeVisible({ timeout: 15_000 });
    },
  );
});
