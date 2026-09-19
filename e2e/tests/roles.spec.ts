import { expect, test } from "./fixtures";
import { uniqueName } from "./helpers/unique";

test.describe("Roles", () => {
  test.beforeEach(async ({ rolesPage }) => {
    await rolesPage.goto();
  });

  test("renders the roles list", async ({ rolesPage }) => {
    await expect(rolesPage.heading).toBeVisible();
    await expect(rolesPage.table).toBeVisible();
    for (const header of [
      "Name",
      "Plugin",
      "Description",
      "Permissions",
      "Locked",
    ]) {
      await expect(
        rolesPage.table.getByRole("columnheader", { name: header }),
      ).toBeVisible();
    }
  });

  test("creates, edits and deletes a role", async ({
    rolesPage,
    cleanup,
    api,
  }) => {
    const name = cleanup.role(uniqueName("role"));

    await rolesPage.create({
      name,
      description: "Created by e2e",
      permission: "core.view_task",
    });
    await rolesPage.filterBy("Name", name);
    await rolesPage.expectRowVisible(name);
    await expect(
      rolesPage.row(name).getByRole("gridcell", { name: "1", exact: true }),
    ).toBeVisible();

    // The name is fixed once created — the edit form disables it.
    await rolesPage.rowAction(name, "Edit");
    const dialog = rolesPage.page.getByRole("dialog", {
      name: `Edit Role: ${name}`,
    });
    await expect(dialog.getByLabel("Name")).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();

    await rolesPage.edit(name, { description: "Edited by e2e" });
    // Verify the persisted change via the API (the modal caches role data).
    await expect.poll(() => api.roleDescription(name)).toBe("Edited by e2e");

    await rolesPage.delete(name);
    await rolesPage.expectRowGone(name);
  });

  test("filters by locked status", async ({ rolesPage }) => {
    await rolesPage.filterLocked("Locked");
    await expect(
      rolesPage.table.getByRole("gridcell", { name: "No", exact: true }),
    ).toHaveCount(0);
    await expect(
      rolesPage.table
        .getByRole("gridcell", { name: "Yes", exact: true })
        .first(),
    ).toBeVisible();

    await rolesPage.filterLocked("Unlocked");
    await expect(
      rolesPage.table.getByRole("gridcell", { name: "Yes", exact: true }),
    ).toHaveCount(0);
  });

  test("disables actions on locked roles", async ({ rolesPage }) => {
    await rolesPage.filterLocked("Locked");
    await rolesPage.expectFirstRowActionsDisabled();
  });
});
