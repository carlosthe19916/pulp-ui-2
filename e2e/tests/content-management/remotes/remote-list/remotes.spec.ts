import { expect, test } from "@support/fixtures";
import { FILE_MANIFEST_URL } from "@support/helpers/fixtureUrls";
import { uniqueName } from "@support/helpers/unique";
import { ConfirmModal } from "@support/pom/ConfirmModal";

// Scenarios: e2e/specs/remotes.md (list, delete).

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
      await api.createRemote("file/file", { name, url: FILE_MANIFEST_URL });

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
      await expect(formPage.textbox("URL")).toHaveValue(FILE_MANIFEST_URL);
    },
  );

  /**
   * RMT-LIST-02 · The filter and sort survive a reload
   *
   * Summary: The Remotes list keeps its name and type filters and sort in the address, so a reload shows the same list.
   *
   * Seed: two file remotes whose names share a unique prefix
   *
   * When I filter the Remotes list by that prefix, pick Type "File" and sort by Name descending
   * Then the address holds both filters and the sort
   * When I reload the page
   * Then the Name filter still holds the prefix, the Type filter shows "File", and both remotes are
   * listed, sorted by Name descending
   */
  test(
    "The Remotes list keeps its name and type filters and sort in the address, so a reload shows the same list.",
    {
      tag: "@RMT-LIST-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/remotes.md#RMT-LIST-02",
      },
    },
    async ({ remotesPage, api, cleanup, page }) => {
      const prefix = uniqueName("remote");
      const names = [`${prefix}-a`, `${prefix}-b`];
      for (const name of names) {
        cleanup.remote(name);
        await api.createRemote("file/file", { name, url: FILE_MANIFEST_URL });
      }

      await remotesPage.goto();
      await remotesPage.filterBy("Name", prefix);
      await remotesPage.list.pickFilterOptions("Type", ["File"]);
      await remotesPage.list.sortBy("Name");
      await remotesPage.list.expectSorted("Name", "descending");
      await expect(page).toHaveURL(new RegExp(`[?&]name=${prefix}(&|$)`));
      await expect(page).toHaveURL(/[?&]direction=desc(&|$)/);
      await expect(page).toHaveURL(/[?&]pulp_type=file\.file(&|$)/);

      await page.reload();
      await remotesPage.list.expectLoaded();
      await expect(remotesPage.list.filterInput("Name")).toHaveValue(prefix);
      await expect(
        page
          .getByRole("list", { name: "Type", exact: true })
          .getByText("File", { exact: true }),
      ).toBeVisible();
      await remotesPage.list.expectSorted("Name", "descending");
      await expect
        .poll(() => remotesPage.list.columnTexts("Name"))
        .toEqual([...names].reverse());
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
      await api.createRemote("file/file", { name, url: FILE_MANIFEST_URL });

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
