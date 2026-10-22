import { expect, test } from "./fixtures";
import { recordApiNotFound } from "./helpers/notFound";
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

  test("assigns and removes a role from the user detail page", async ({
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

    const detail = await usersPage.openDetail(username);
    await detail.addRole(roleName);
    await expect.poll(() => api.userRoleNames(username)).toContain(roleName);
    await detail.expectRoleNotSelectable(roleName);

    await detail.removeRole(roleName);
    await expect
      .poll(() => api.userRoleNames(username))
      .not.toContain(roleName);
  });

  test("adds and removes the user from a group on the detail page", async ({
    usersPage,
    groupsPage,
    cleanup,
    api,
  }) => {
    const groupName = cleanup.group(uniqueName("group"));
    const username = cleanup.user(uniqueName("user"));

    await groupsPage.goto();
    await groupsPage.create(groupName);

    await usersPage.goto();
    await usersPage.create({ username, password: STRONG_PASSWORD });
    await usersPage.filterBy("Username", username);

    const detail = await usersPage.openDetail(username);
    await detail.addGroup(groupName);
    await expect.poll(() => api.userGroupNames(username)).toContain(groupName);

    await detail.removeGroup(groupName);
    await expect
      .poll(() => api.userGroupNames(username))
      .not.toContain(groupName);
  });

  test("deletes a user from its detail page", async ({
    usersPage,
    cleanup,
    page,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await usersPage.create({ username, password: STRONG_PASSWORD });
    await usersPage.filterBy("Username", username);

    const detail = await usersPage.openDetail(username);
    const notFound = recordApiNotFound(page);
    await detail.deleteUser();
    await expect(page).toHaveURL(/\/admin\/users$/);
    // The still-mounted detail page must not refetch the deleted user.
    expect(notFound).toEqual([]);
  });

  test("filters the list by username", async ({ usersPage, cleanup }) => {
    const username = cleanup.user(uniqueName("user"));
    await usersPage.create({ username, password: STRONG_PASSWORD });

    await usersPage.filterBy("Username", username);
    await usersPage.expectRowVisible(username);
    await expect(usersPage.table.locator("tbody tr")).toHaveCount(1);
  });
});
