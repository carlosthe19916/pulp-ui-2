import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";
import { ConfirmModal } from "@support/pom/ConfirmModal";

// Scenarios: e2e/specs/remotes.md (list, delete).

const FILE_URL = "https://fixtures.pulpproject.org/file/PULP_MANIFEST";

test.describe("Remotes", () => {
  /**
   * RMT-LIST-01 · Create and Edit open the form pages
   *
   * Summary: The Remotes list's "Create remote" opens the create page, and a row's Edit opens that remote's edit page.
   *
   * Seed: a file remote
   *
   * When I click "Create remote" on the Remotes list
   * Then the create page opens with the title of the first installed type's form
   * When I go back and choose "Edit" in the file remote's row actions
   * Then "Edit file remote" opens with that remote's values filled in
   */
  test(
    "The Remotes list's \"Create remote\" opens the create page, and a row's Edit opens that remote's edit page.",
    {
      tag: "@RMT-LIST-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/remotes.md#RMT-LIST-01",
      },
    },
    async ({ remotesPage, formPage, api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      await api.createRemote("file/file", { name, url: FILE_URL });

      await remotesPage.goto();
      await page
        .getByRole("button", { name: "Create remote", exact: true })
        .click();
      await expect(page).toHaveURL(/\/remotes\/create/);
      await expect(formPage.heading(/^Create .+ remote$/)).toBeVisible();

      await page.goBack();
      await remotesPage.filterBy("Name", name);
      await remotesPage.rowAction(name, "Edit");
      await expect(formPage.heading("Edit file remote")).toBeVisible();
      await expect(formPage.textbox("Name")).toHaveValue(name);
      await expect(formPage.textbox("URL")).toHaveValue(FILE_URL);
    },
  );

  /**
   * RMT-DEL-01 · Delete a remote
   *
   * Summary: Deleting a remote from the list removes it after confirmation.
   *
   * Seed: a file remote
   *
   * When I choose "Delete" in its row actions and confirm "Delete Remote"
   * Then the toast "Remote "<name>" deletion started" appears and the row disappears
   */
  test(
    "Deleting a remote from the list removes it after confirmation.",
    {
      tag: "@RMT-DEL-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/remotes.md#RMT-DEL-01",
      },
    },
    async ({ remotesPage, toasts, api, cleanup, page }) => {
      const name = cleanup.remote(uniqueName("remote"));
      await api.createRemote("file/file", { name, url: FILE_URL });

      await remotesPage.goto();
      await remotesPage.filterBy("Name", name);
      await remotesPage.rowAction(name, "Delete");
      await new ConfirmModal(page, "Delete Remote").confirm("Delete");

      await expect(
        toasts.info(`Remote "${name}" deletion started`),
      ).toBeVisible();
      await remotesPage.expectRowGone(name);
    },
  );
});
