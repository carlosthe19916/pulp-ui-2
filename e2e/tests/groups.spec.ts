import { expect, test } from "./fixtures";
import { recordApiNotFound } from "./helpers/notFound";
import { STRONG_PASSWORD, uniqueName } from "./helpers/unique";

test.describe("Groups", () => {
  test.beforeEach(async ({ groupsPage }) => {
    await groupsPage.goto();
  });

  test("renders the groups list", async ({ groupsPage }) => {
    await expect(groupsPage.heading).toBeVisible();
    await expect(groupsPage.table).toBeVisible();
    await expect(
      groupsPage.table.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
  });

  test("creates, renames and deletes a group", async ({
    groupsPage,
    cleanup,
  }) => {
    const name = cleanup.group(uniqueName("group"));
    const renamed = cleanup.group(uniqueName("group"));

    await groupsPage.create(name);
    await groupsPage.filterBy("Name", name);
    await groupsPage.expectRowVisible(name);
    await expect(
      groupsPage.row(name).getByRole("link", { name }),
    ).toBeVisible();

    await groupsPage.rename(name, renamed);
    await groupsPage.filterBy("Name", renamed);
    await groupsPage.expectRowVisible(renamed);

    await groupsPage.delete(renamed);
    await groupsPage.expectRowGone(renamed);
  });

  test("opens the group detail page with tabs", async ({
    groupsPage,
    cleanup,
  }) => {
    const name = cleanup.group(uniqueName("group"));
    await groupsPage.create(name);
    await groupsPage.filterBy("Name", name);

    const detail = await groupsPage.openDetail(name);
    await expect(detail.title).toBeVisible();
    await expect(detail.usersTab).toBeVisible();
    await expect(detail.rolesTab).toBeVisible();
  });

  test("adds and removes a user in the group", async ({
    groupsPage,
    usersPage,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const name = cleanup.group(uniqueName("group"));

    await usersPage.goto();
    await usersPage.create({ username, password: STRONG_PASSWORD });

    await groupsPage.goto();
    await groupsPage.create(name);
    await groupsPage.filterBy("Name", name);
    const detail = await groupsPage.openDetail(name);

    await detail.addUser(username);
    await detail.removeUser(username);
  });

  test("a member added on the group page shows on the cached user page", async ({
    groupsPage,
    usersPage,
    cleanup,
    page,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const name = cleanup.group(uniqueName("group"));
    await groupsPage.create(name);

    // Visit the user page first so its record (with no groups) is cached.
    await usersPage.goto();
    await usersPage.create({ username, password: STRONG_PASSWORD });
    await usersPage.filterBy("Username", username);
    const userDetail = await usersPage.openDetail(username);
    await expect(userDetail.groupsTab).toHaveText("Groups (0)");

    // Navigate in-app (no reload) so the cache survives.
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Groups", exact: true })
      .click();
    // The user page also has a "Filter by Name" box; wait for the list first.
    await expect(groupsPage.heading).toBeVisible();
    await groupsPage.filterBy("Name", name);
    const groupDetail = await groupsPage.openDetail(name);
    await groupDetail.addUser(username);

    await groupDetail.usersTable
      .getByRole("link", { name: username, exact: true })
      .click();
    await expect(userDetail.groupsTab).toHaveText("Groups (1)");
    await userDetail.groupsTab.click();
    await expect(
      userDetail.groupsTable.getByRole("link", { name, exact: true }),
    ).toBeVisible();
  });

  test("adds and removes a role in the group", async ({
    groupsPage,
    rolesPage,
    cleanup,
  }) => {
    const roleName = cleanup.role(uniqueName("role"));
    const name = cleanup.group(uniqueName("group"));

    await rolesPage.goto();
    await rolesPage.create({ name: roleName, permission: "core.view_task" });

    await groupsPage.goto();
    await groupsPage.create(name);
    await groupsPage.filterBy("Name", name);
    const detail = await groupsPage.openDetail(name);

    await detail.addRole(roleName);
    await detail.removeRole(roleName);
  });

  test("deletes a group from its detail page", async ({
    groupsPage,
    cleanup,
    page,
  }) => {
    const name = cleanup.group(uniqueName("group"));
    await groupsPage.create(name);
    await groupsPage.filterBy("Name", name);

    const detail = await groupsPage.openDetail(name);
    const notFound = recordApiNotFound(page);
    await detail.deleteGroup();
    await expect(page).toHaveURL(/\/admin\/groups$/);
    // The still-mounted detail page must not refetch the deleted group.
    expect(notFound).toEqual([]);
  });
});
