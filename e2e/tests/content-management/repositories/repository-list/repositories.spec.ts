import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

// Scenarios: e2e/specs/repositories.md (list and detail entry points).

test.describe("Repositories", () => {
  /**
   * REP-LIST-01 · Create and Edit open the form pages
   *
   * Summary: "Create repository" opens the create page, and Edit in a row or on the detail page opens that repository's edit page.
   *
   * Seed: a file repository
   *
   * When I click "Create repository" on the Repositories list
   * Then the create page opens with its Type select
   * When I choose "Edit" in the file repository's row actions
   * Then "Edit file repository" opens with its values filled in
   * When I choose "Edit" in its detail page's actions menu
   * Then the same edit page opens
   */
  test(
    '"Create repository" opens the create page, and Edit in a row or on the detail page opens that repository\'s edit page.',
    {
      tag: "@REP-LIST-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/repositories.md#REP-LIST-01",
      },
    },
    async ({ repositoriesPage, formPage, api, cleanup, page }) => {
      const name = cleanup.repository(uniqueName("repo"));
      await api.createRepository("file/file", {
        name,
        description: "Release files",
      });

      await repositoriesPage.goto();
      await page
        .getByRole("button", { name: "Create repository", exact: true })
        .click();
      await expect(page).toHaveURL(/\/repositories\/create/);
      await expect(page.getByRole("combobox", { name: "Type" })).toBeVisible();

      await page.goBack();
      await repositoriesPage.filterBy("Name", name);
      await repositoriesPage.rowAction(name, "Edit");
      await expect(formPage.heading("Edit file repository")).toBeVisible();
      await expect(formPage.textbox("Name")).toHaveValue(name);
      await expect(formPage.textbox("Description")).toHaveValue(
        "Release files",
      );
      const editUrl = page.url();

      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await page.getByRole("button", { name: "Actions" }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      await expect(formPage.heading("Edit file repository")).toBeVisible();
      expect(page.url()).toBe(editUrl);
    },
  );
});
