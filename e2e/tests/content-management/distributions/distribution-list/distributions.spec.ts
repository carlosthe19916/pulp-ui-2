import { expect, test } from "@support/fixtures";
import {
  idOf,
  seedDistribution,
  seedRepository,
} from "@support/helpers/distributions";

// Scenarios: e2e/specs/distributions.md (list, opening a detail page).

test.describe("Distributions", () => {
  /**
   * DST-LIST-01 · Create and Edit open the form pages
   *
   * Summary: "Create distribution" opens the create page, and a row's Edit opens that distribution's edit page.
   *
   * Seed: a file distribution
   *
   * When I click "Create distribution" on the Distributions list
   * Then the create page opens with its Type select
   * When I choose "Edit" in the file distribution's row actions
   * Then "Edit file distribution" opens with its values filled in
   */
  test(
    "\"Create distribution\" opens the create page, and a row's Edit opens that distribution's edit page.",
    {
      tag: "@DST-LIST-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-LIST-01",
      },
    },
    async ({ distributionsPage, formPage, api, cleanup, page }) => {
      const { name, basePath } = await seedDistribution(api, cleanup);

      await distributionsPage.goto();
      await page
        .getByRole("button", { name: "Create distribution", exact: true })
        .click();
      await expect(page).toHaveURL(/\/distributions\/create/);
      await expect(page.getByRole("combobox", { name: "Type" })).toBeVisible();

      await page.goBack();
      await distributionsPage.filterBy("Name", name);
      await distributionsPage.rowAction(name, "Edit");
      await expect(formPage.heading("Edit file distribution")).toBeVisible();
      await expect(formPage.textbox("Name")).toHaveValue(name);
      await expect(formPage.textbox("Base path")).toHaveValue(basePath);
    },
  );

  /**
   * DST-DET-01 · Open a distribution's page from its name
   *
   * Summary: A distribution's name links to its detail page from the Distributions list and from its repository's Distributions tab.
   *
   * Seed: a file repository and a file distribution serving it
   *
   * When I click the distribution's name in the Distributions list
   * Then its detail page opens with the title of its name, the label "plugin: file.file" and the
   * tabs Details, Tasks and Access
   * When I go to the repository's Distributions tab and click the distribution's name
   * Then the same detail page opens
   */
  test(
    "A distribution's name links to its detail page from the Distributions list and from its repository's Distributions tab.",
    {
      tag: "@DST-DET-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/distributions.md#DST-DET-01",
      },
    },
    async ({ distributionsPage, api, cleanup, page }) => {
      const repository = await seedRepository(api, cleanup);
      const { name } = await seedDistribution(api, cleanup, {
        repository: repository.href,
      });
      const heading = page.getByRole("heading", { level: 1, name });

      const expectDetailPage = async () => {
        await expect(heading).toBeVisible();
        await expect(page.getByText("plugin: file.file")).toBeVisible();
        for (const tab of [/^Details$/, /^Tasks \(\d+\)$/, /^Access$/]) {
          await expect(page.getByRole("tab", { name: tab })).toBeVisible();
        }
      };

      await distributionsPage.goto();
      await distributionsPage.filterBy("Name", name);
      await distributionsPage.row(name).getByRole("link", { name }).click();
      await expectDetailPage();

      await page.goto(
        `/content-management/default/repositories/file.file/${idOf(repository.href)}`,
      );
      await page.getByRole("tab", { name: /^Distributions/ }).click();
      await page
        .getByRole("grid", { name: "Repository distributions table" })
        .getByRole("link", { name, exact: true })
        .click();
      await expectDetailPage();
    },
  );
});
