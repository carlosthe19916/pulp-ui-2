import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

test.describe("Domains", () => {
  test.beforeEach(async ({ domainsPage }) => {
    await domainsPage.goto();
  });

  test("renders the domains list", async ({ domainsPage }) => {
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
  });

  test("shows the default domain with its actions disabled", async ({
    domainsPage,
  }) => {
    // The default domain sorts first, so it's on page one without filtering.
    await domainsPage.expectRowVisible("default");
    await domainsPage.expectRowActionsDisabled("default");
  });

  test("rejects an invalid domain name", async ({ domainsPage, page }) => {
    const dialog = await domainsPage.openCreate();
    const name = dialog.getByLabel("Name");
    await name.fill("bad name");
    await name.blur();
    await expect(
      page.getByText(
        "Name may only contain letters, numbers, hyphens and underscores",
      ),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  });

  test("creates, edits and deletes a domain", async ({
    domainsPage,
    cleanup,
    api,
  }) => {
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
  });

  test("filters the list by name", async ({ domainsPage, cleanup }) => {
    const name = cleanup.domain(uniqueName("domain"));
    await domainsPage.create({
      name,
      storageBackend: "Local filesystem",
      storageSettings: { Location: `/var/lib/pulp/media/${name}` },
    });

    await domainsPage.filterBy("Name", name);
    await domainsPage.expectRowVisible(name);
    await expect(domainsPage.table.locator("tbody tr")).toHaveCount(1);
  });

  // Storage backends other than the local filesystem aren't installed on the dev
  // backend, so these cover the client-side required-field validation (which must
  // match the server's) rather than a full create/edit round-trip.
  test("enforces S3 required fields on create", async ({ domainsPage }) => {
    const dialog = await domainsPage.openCreate();
    await dialog.getByLabel("Name").fill(uniqueName("domain"));
    await dialog
      .getByLabel("Storage backend")
      .selectOption({ label: "Amazon S3" });
    await dialog.getByRole("button", { name: "Create", exact: true }).click();

    // Submit is blocked and every required field is flagged.
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Bucket name is required")).toBeVisible();
    await expect(dialog.getByText("Access key is required")).toBeVisible();
    await expect(dialog.getByText("Secret key is required")).toBeVisible();

    // Filling the required fields clears their errors.
    await dialog.getByLabel("Bucket name").fill("my-bucket");
    await dialog.getByLabel("Access key").fill("AKIA");
    await dialog.getByLabel("Secret key").fill("secret");
    await expect(dialog.getByText("Bucket name is required")).toBeHidden();
    await expect(dialog.getByText("Access key is required")).toBeHidden();
    await expect(dialog.getByText("Secret key is required")).toBeHidden();

    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  });

  test("enforces Azure required fields on create", async ({ domainsPage }) => {
    const dialog = await domainsPage.openCreate();
    await dialog.getByLabel("Name").fill(uniqueName("domain"));
    await dialog
      .getByLabel("Storage backend")
      .selectOption({ label: "Azure Blob" });
    await dialog.getByRole("button", { name: "Create", exact: true }).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Container is required")).toBeVisible();
    await expect(dialog.getByText("Account name is required")).toBeVisible();
    await expect(dialog.getByText("Account key is required")).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  });

  // Regression: switching an existing domain's backend must apply the new backend's
  // required-field rules (previously the storage fields were hidden on edit).
  test("enforces S3 required fields when switching backend on edit", async ({
    domainsPage,
    cleanup,
  }) => {
    const name = cleanup.domain(uniqueName("domain"));
    await domainsPage.create({
      name,
      storageBackend: "Local filesystem",
      storageSettings: { Location: `/var/lib/pulp/media/${name}` },
    });
    await domainsPage.filterBy("Name", name);
    await domainsPage.expectRowVisible(name);

    const dialog = await domainsPage.openEdit(name);
    await dialog
      .getByLabel("Storage backend")
      .selectOption({ label: "Amazon S3" });
    await dialog.getByRole("button", { name: "Save", exact: true }).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Bucket name is required")).toBeVisible();
    await expect(dialog.getByText("Access key is required")).toBeVisible();
    await expect(dialog.getByText("Secret key is required")).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  });
});
