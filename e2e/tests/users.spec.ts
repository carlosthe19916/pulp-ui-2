import { expect, test } from "./fixtures";
import { STRONG_PASSWORD, uniqueName } from "./helpers/unique";

test.describe("Users", () => {
  test.beforeEach(async ({ usersPage }) => {
    await usersPage.goto();
  });

  test("renders the users list", async ({ usersPage }) => {
    await expect(usersPage.heading).toBeVisible();
    await expect(usersPage.table).toBeVisible();
    for (const header of [
      "Username",
      "Email",
      "Active",
      "Groups",
      "Date Joined",
    ]) {
      await expect(
        usersPage.table.getByRole("columnheader", { name: header }),
      ).toBeVisible();
    }
  });

  test("requires username and password when creating", async ({
    usersPage,
    page,
  }) => {
    const dialog = await usersPage.openCreate();
    const username = dialog.getByLabel("Username");
    const password = dialog.getByLabel("Password");
    // Errors only surface once a field is dirty and blurred, so type, clear, blur.
    await username.fill("x");
    await username.fill("");
    await username.blur();
    await password.fill("x");
    await password.fill("");
    await password.blur();
    await expect(page.getByText("Username is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  });

  test("creates, edits and deletes a user", async ({
    usersPage,
    cleanup,
    api,
  }) => {
    const username = cleanup.user(uniqueName("user"));

    await usersPage.create({
      username,
      password: STRONG_PASSWORD,
      email: "before@example.com",
      firstName: "Before",
    });
    await usersPage.filterBy("Username", username);
    await usersPage.expectRowVisible(username);

    await usersPage.edit(username, { firstName: "After" });
    // The edit modal seeds its fields once from a cached query, so verify the
    // persisted change through the API rather than reopening the modal.
    await expect.poll(() => api.userFirstName(username)).toBe("After");

    await usersPage.delete(username);
    await usersPage.expectRowGone(username);
  });

  test("assigns a role to a user", async ({
    usersPage,
    rolesPage,
    cleanup,
    api,
  }) => {
    const roleName = cleanup.role(uniqueName("role"));
    const username = cleanup.user(uniqueName("user"));

    await rolesPage.goto();
    await rolesPage.create({ name: roleName, permission: "core.view_task" });

    await usersPage.goto();
    await usersPage.create({ username, password: STRONG_PASSWORD });
    await usersPage.filterBy("Username", username);

    await usersPage.assignRole(username, roleName);
    // The modal seeds its state once from a cached query, so verify the
    // persisted assignment through the API rather than reopening the modal.
    await expect.poll(() => api.userRoleNames(username)).toContain(roleName);
  });

  test("filters the list by username", async ({ usersPage, cleanup }) => {
    const username = cleanup.user(uniqueName("user"));
    await usersPage.create({ username, password: STRONG_PASSWORD });

    await usersPage.filterBy("Username", username);
    await usersPage.expectRowVisible(username);
    await expect(usersPage.table.locator("tbody tr")).toHaveCount(1);
  });
});
