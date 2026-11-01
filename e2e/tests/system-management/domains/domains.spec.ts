import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

test.describe("Domains (enabled)", () => {
  test.beforeEach(async ({ domainsPage, api }) => {
    test.skip(!api.domainEnabled, "domains feature disabled on this backend");
    await domainsPage.goto();
  });

  /**
   * DOM-LIST-01 · Row content
   *
   * Summary: The Domains list shows each domain's name, description, storage, redirect, hide-guarded and created columns.
   *
   * Requires: domains
   *
   * When I open Domains from the System navigation
   * Then the heading is "Domains" and the column headers are, in order: Name, Description, Storage,
   * Redirect, Hide guarded, Created, actions
   * And a domain I create with a description and local-filesystem storage shows, in its row, that
   * description, the storage label "Local filesystem", and Redirect and Hide guarded as Yes/No labels
   */
  test(
    "The Domains list shows each domain's name, description, storage, redirect, hide-guarded and created columns.",
    {
      tag: "@DOM-LIST-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/domains.md#DOM-LIST-01",
      },
    },
    async ({ domainsPage, cleanup }) => {
      await expect(domainsPage.heading).toBeVisible();
      await expect(domainsPage.table).toBeVisible();
      for (const header of [
        "Name",
        "Description",
        "Storage",
        "Redirect",
        "Hide guarded",
        "Created",
      ]) {
        await expect(
          domainsPage.table.getByRole("columnheader", {
            name: header,
            exact: true,
          }),
        ).toBeVisible();
      }

      // A domain created with known settings renders each column's cell: description,
      // the human-readable storage label, and the Redirect / Hide guarded Yes/No labels
      // (the create form defaults to redirect on, hide guarded off).
      const name = cleanup.domain(uniqueName("domain"));
      await domainsPage.create({
        name,
        description: "List row",
        storageBackend: "Local filesystem",
        storageSettings: { Location: `/var/lib/pulp/media/${name}` },
      });
      await domainsPage.filterBy("Name", name);
      const row = domainsPage.row(name);
      await expect(row).toBeVisible();
      await expect(row.getByText("List row")).toBeVisible();
      await expect(row.getByText("Local filesystem")).toBeVisible();
      await expect(row.getByText("Yes", { exact: true })).toBeVisible();
      await expect(row.getByText("No", { exact: true })).toBeVisible();
    },
  );

  /**
   * DOM-LIST-02 · Expand storage settings
   *
   * Summary: Expanding a domain's Storage cell reveals its storage backend settings.
   *
   * Requires: domains
   * Seed: a local-filesystem domain
   *
   * Given a local-filesystem domain with a Location
   * When I expand its Storage cell
   * Then its storage settings are revealed, including the Location path
   */
  test(
    "Expanding a domain's Storage cell reveals its storage backend settings.",
    {
      tag: "@DOM-LIST-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/domains.md#DOM-LIST-02",
      },
    },
    async ({ domainsPage, cleanup }) => {
      const name = cleanup.domain(uniqueName("domain"));
      const location = `/var/lib/pulp/media/${name}`;
      await domainsPage.create({
        name,
        storageBackend: "Local filesystem",
        storageSettings: { Location: location },
      });
      await domainsPage.filterBy("Name", name);
      await domainsPage.expectRowVisible(name);

      // The Storage cell is the row's first (compound-expand) button.
      await domainsPage.expandRow(name);
      await expect(domainsPage.page.getByText(location)).toBeVisible();
    },
  );

  /**
   * DOM-DEF-01 · The default domain's actions are disabled
   *
   * Summary: The default domain's Edit and Delete row actions are disabled.
   *
   * Requires: domains
   *
   * When I open the row actions of the "default" domain
   * Then Edit and Delete are disabled, with the tooltip "The default domain can't be edited or
   * deleted" (Pulp forbids editing or deleting the default domain)
   * And the Edit labels action is enabled, since labels are editable on every domain
   */
  test(
    "The default domain's Edit and Delete row actions are disabled.",
    {
      tag: "@DOM-DEF-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/domains.md#DOM-DEF-01",
      },
    },
    async ({ domainsPage }) => {
      // The default domain sorts first, so it's on page one without filtering.
      await domainsPage.expectRowVisible("default");
      await domainsPage.expectRowActionsDisabled("default");
    },
  );

  /**
   * DOM-CRUD-01 · Create, edit and delete a domain
   *
   * Summary: Creating, editing and deleting a local-filesystem domain round-trips through the list and the API.
   *
   * Requires: domains
   *
   * When I create a local-filesystem domain with a description and a Location
   * Then the create dialog closes and the domain appears in the list
   * When I edit its description and Location and save
   * Then the edit dialog closes and the new description and Location are persisted (read back through
   * the API, since the edit form seeds its fields once from a cached query)
   * When I delete it and confirm
   * Then the row is gone
   */
  test(
    "Creating, editing and deleting a local-filesystem domain round-trips through the list and the API.",
    {
      tag: "@DOM-CRUD-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/domains.md#DOM-CRUD-01",
      },
    },
    async ({ domainsPage, cleanup, api }) => {
      const name = cleanup.domain(uniqueName("domain"));

      await domainsPage.create({
        name,
        description: "Before",
        storageBackend: "Local filesystem",
        storageSettings: { Location: `/var/lib/pulp/media/${name}` },
      });
      await domainsPage.filterBy("Name", name);
      await domainsPage.expectRowVisible(name);

      const editedLocation = `/var/lib/pulp/media/${name}-edited`;
      await domainsPage.edit(name, {
        description: "After",
        storageSettings: { Location: editedLocation },
      });
      // The edit modal seeds its fields once from a cached query, so verify the
      // persisted change through the API rather than reopening the modal.
      await expect.poll(() => api.domainDescription(name)).toBe("After");
      await expect
        .poll(async () => (await api.domainStorageSettings(name))?.location)
        .toBe(editedLocation);

      await domainsPage.delete(name);
      await domainsPage.expectRowGone(name);
    },
  );

  /**
   * DOM-LIST-03 · Filter by name
   *
   * Summary: Filtering the Domains list by name narrows it to the matching domain.
   *
   * Requires: domains
   *
   * Given a domain I created
   * When I filter the list by its name
   * Then only that domain is listed
   */
  test(
    "Filtering the Domains list by name narrows it to the matching domain.",
    {
      tag: "@DOM-LIST-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/domains.md#DOM-LIST-03",
      },
    },
    async ({ domainsPage, cleanup }) => {
      const name = cleanup.domain(uniqueName("domain"));
      await domainsPage.create({
        name,
        storageBackend: "Local filesystem",
        storageSettings: { Location: `/var/lib/pulp/media/${name}` },
      });

      await domainsPage.filterBy("Name", name);
      await domainsPage.expectRowVisible(name);
      // Compound-expand tables render one tbody per row, each with a hidden expansion
      // row, so count data rows by role (header and collapsed expansion rows excluded).
      await expect(
        domainsPage.table
          .getByRole("row")
          .filter({ hasNot: domainsPage.page.getByRole("columnheader") }),
      ).toHaveCount(1);
    },
  );
});

test.describe("Domains (disabled)", () => {
  test.beforeEach(async ({ api }) => {
    test.skip(api.domainEnabled, "domains feature enabled on this backend");
  });

  /**
   * DOM-DIS-01 · Domains hidden from the navigation
   *
   * Summary: With the domains feature disabled, the Domains navigation item is not shown.
   *
   * On a backend with the domains feature disabled:
   *
   * When I open the app
   * Then the navigation has no "Domains" item
   */
  test(
    "With the domains feature disabled, the Domains navigation item is not shown.",
    {
      tag: "@DOM-DIS-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/domains.md#DOM-DIS-01",
      },
    },
    async ({ page }) => {
      await page.goto("/");
      const nav = page.getByRole("navigation", { name: "Nav" });
      await expect(nav).toBeVisible();
      await expect(
        nav.getByRole("link", { name: "Domains", exact: true }),
      ).toBeHidden();
    },
  );

  /**
   * DOM-DIS-02 · Disabled empty state on the domains route
   *
   * Summary: Opening the domains route with the feature disabled shows the "Domains are not enabled" empty state.
   *
   * On a backend with the domains feature disabled:
   *
   * When I open the domains route
   * Then the "Domains are not enabled" empty state is shown
   */
  test(
    'Opening the domains route with the feature disabled shows the "Domains are not enabled" empty state.',
    {
      tag: "@DOM-DIS-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/domains.md#DOM-DIS-02",
      },
    },
    async ({ domainsPage }) => {
      await domainsPage.expectDisabledState();
    },
  );
});
