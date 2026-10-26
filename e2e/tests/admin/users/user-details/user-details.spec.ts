import { expect, test } from "../../../fixtures";
import { delayApi } from "../../../helpers/delayApi";
import { recordApiNotFound } from "../../../helpers/notFound";
import { uniqueName } from "../../../helpers/unique";
import { COL, cell, groupId, openDetail } from "../../../helpers/users";
import { RoleAssignmentsTab } from "../../../pom/RoleAssignmentsTab";
import { UserDetailPage } from "../../../pom/UserDetailPage";

// Scenarios: e2e/specs/users.md (detail page, Groups tab, Roles tab).

test.describe("Users", () => {
  // --- Detail page --------------------------------------------------------

  test("USR-DET-01 header, tabs and counts", async ({ page, api, cleanup }) => {
    test.slow();
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    // A user in 1 group with 12 role assignments: 12 is above a page, so the tab
    // count proves the total, not the visible rows.
    const group = cleanup.group(uniqueName("group"));
    await api.createGroup(group);
    await api.addGroupMember(group, username);
    const roles = Array.from({ length: 12 }, () =>
      cleanup.role(uniqueName("role")),
    );
    for (const role of roles) {
      await api.createRole({ name: role });
      await api.assignRole({ user: username }, { role });
    }

    const detail = await openDetail(page, api, username);
    await expect(detail.title).toBeVisible();
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Edit User", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Delete User", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tab", { name: "Groups (1)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tab", { name: "Roles (12)" })).toBeVisible();
  });

  test("USR-DET-06 opening a user detail page directly", async ({
    page,
    context,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const { id } = await api.createUser({ username });

    // Via a new tab (the POM's goto waits out the slow detail-route load).
    const tab = await context.newPage();
    await new UserDetailPage(tab, username).goto(id);
    await expect(tab).toHaveTitle(new RegExp(`^User · ${username} · `));
    await tab.close();

    // Via reload, with the loading state held visible.
    const held = await delayApi(page, {
      url: (url) => url.pathname.endsWith(`/users/${id}/`),
      method: "GET",
    });
    await page.goto(`/admin/users/${id}`);
    await expect(
      page.getByRole("progressbar", { name: "Loading user" }),
    ).toBeVisible();
    held.release();
    await expect(
      page.getByRole("heading", { level: 1, name: username }),
    ).toBeVisible();

    // The breadcrumb returns to the Users list.
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("listitem")).toHaveText([
      "Users",
      username,
    ]);
    await expect(
      breadcrumb.getByRole("link", { name: username, exact: true }),
    ).toHaveCount(0);
    await breadcrumb.getByRole("link", { name: "Users", exact: true }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Users", exact: true }),
    ).toBeVisible();
  });

  test("USR-DET-07 detail-route errors show 404", async ({
    page,
    api,
    cleanup,
  }) => {
    for (const which of ["missing", "abc", "deleted"] as const) {
      await test.step(which, async () => {
        let id = which === "abc" ? "abc" : "999999999";
        if (which === "deleted") {
          const username = cleanup.user(uniqueName("user"));
          id = String((await api.createUser({ username })).id);
          await api.deleteUser(username);
        }
        await page.goto(`/admin/users/${id}`);
        await expect(
          page.getByRole("heading", { name: "404: That page does not exist" }),
        ).toBeVisible();
      });
    }
  });

  test("USR-DET-08 a non-superuser cannot open a user detail page", async ({
    api,
    cleanup,
    secondUser,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const { id } = await api.createUser({ username });
    const user = await secondUser.create();
    const page = await secondUser.login(user);
    await page.goto(`/admin/users/${id}`);
    await expect(
      page.getByRole("heading", { name: "403: Access denied" }),
    ).toBeVisible();
  });

  test("USR-DEL-05 deleting from the detail page", async ({
    page,
    api,
    cleanup,
    toasts,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const { id } = await api.createUser({ username });
    const detail = new UserDetailPage(page, username);
    await detail.goto(id);
    const notFound = recordApiNotFound(page);
    await detail.deleteUser();
    await expect(toasts.success(`User "${username}" deleted`)).toBeVisible();
    // The list opens, and nothing refetches the deleted user.
    await expect(page).toHaveURL(/\/admin\/users\/?$/);
    expect(notFound.filter((url) => url.includes(`/users/${id}/`))).toEqual([]);
  });

  // --- Groups tab ---------------------------------------------------------

  test("USR-GRP-03 add and remove a group", async ({
    page,
    api,
    cleanup,
    toasts,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const group = cleanup.group(uniqueName("group"));
    await api.createUser({ username });
    await api.createGroup(group);
    const detail = await openDetail(page, api, username);
    // Always enabled: a user's detail page is superuser-only.
    await expect(
      page.getByRole("button", { name: "Add Group", exact: true }),
    ).toBeEnabled();
    await detail.addGroup(group);
    await expect(
      toasts.success(`1 group added to user "${username}"`),
    ).toBeVisible();
    await expect(detail.groupsTab).toHaveText("Groups (1)");
    await detail.removeGroup(group);
    await expect(
      toasts.success(`User "${username}" removed from group "${group}"`),
    ).toBeVisible();
    await expect(detail.groupsTab).toHaveText("Groups (0)");
    await expect.poll(() => api.userGroupNames(username)).toEqual([]);
  });

  test("USR-GRP-05 user › Groups › add group G shows on G and in the Users list", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const group = cleanup.group(uniqueName("group"));
    await api.createUser({ username });
    await api.createGroup(group);
    const detail = await openDetail(page, api, username);
    await detail.addGroup(group);

    await detail.groupsTable
      .getByRole("link", { name: group, exact: true })
      .click();
    await expect(
      page
        .getByRole("grid", { name: "Group users table" })
        .getByRole("link", { name: username, exact: true }),
    ).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Nav" });
    await nav.getByRole("button", { name: "Administration" }).click();
    await nav.getByRole("link", { name: "Users", exact: true }).click();
    const usersGrid = page.getByRole("grid", { name: "Users table" });
    await expect(usersGrid).toBeVisible();
    await page.getByPlaceholder("Filter by Username").fill(username);
    await expect(
      cell(
        usersGrid.getByRole("row").filter({ hasText: username }),
        COL.groups,
      ),
    ).toHaveText("1");
  });

  test("USR-GRP-05 user › Groups › remove group G no longer shows on G", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const group = cleanup.group(uniqueName("group"));
    await api.createUser({ username });
    await api.createGroup(group);
    await api.addGroupMember(group, username);
    const detail = await openDetail(page, api, username);
    await detail.removeGroup(group);
    await page.goto(`/admin/groups/${await groupId(api, group)}`);
    await expect(page.getByRole("tab", { name: "Users (0)" })).toBeVisible();
  });

  test("USR-GRP-07 the Groups tab empty state", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    await api.createGroup(cleanup.group(uniqueName("group")));
    const detail = await openDetail(page, api, username);
    await expect(
      detail.groups.stateHeading("User is not a member of any group"),
    ).toBeVisible();
    await expect(detail.groups.rows).toHaveCount(1);
  });

  // --- Roles tab ----------------------------------------------------------

  test("USR-ROL-01 role assignment rows, filtering, sorting and paging", async ({
    page,
    api,
    cleanup,
  }) => {
    test.slow();
    // Empty state.
    const empty = cleanup.user(uniqueName("user"));
    await api.createUser({ username: empty });
    await openDetail(page, api, empty);
    const emptyTab = new RoleAssignmentsTab(page, "user");
    await emptyTab.open();
    await expect(
      emptyTab.table.stateHeading("No roles assigned to this user"),
    ).toBeVisible();

    // 12 assigned roles sharing a token; one carries a description.
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    const token = uniqueName("ra").slice(-8);
    const described = cleanup.role(`${token}-described`);
    await api.createRole({
      name: described,
      description: "Views repositories",
      permissions: ["core.view_task"],
    });
    const roles = [
      described,
      ...Array.from({ length: 11 }, (_, i) =>
        cleanup.role(`${token}-r${String(i).padStart(2, "0")}`),
      ),
    ];
    for (const name of roles.slice(1)) await api.createRole({ name });
    for (const name of roles)
      await api.assignRole({ user: username }, { role: name });

    await openDetail(page, api, username);
    const tab = new RoleAssignmentsTab(page, "user");
    await tab.open();
    await tab.table.expectSorted("Role", "ascending");
    const cells = tab.rows(described).getByRole("gridcell");
    await expect(cells.nth(0)).toHaveText(described);
    await expect(cells.nth(1)).toHaveText("Views repositories");
    await expect(cells.nth(2)).toHaveText("1");
    await expect(cells.nth(3)).toHaveText(/\d/);

    await tab.table.filter("Role", token);
    await expect
      .poll(async () => (await tab.table.paginator().range()).total)
      .toBe(12);
    await tab.table.sortBy("Role");
    await tab.table.expectSorted("Role", "descending");
  });

  test("USR-ROL-02 add roles", async ({ page, api, cleanup, toasts }) => {
    test.slow();
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    const roles = [
      cleanup.role(uniqueName("role")),
      cleanup.role(uniqueName("role")),
    ];
    for (const name of roles) await api.createRole({ name });
    const detail = await openDetail(page, api, username);
    const tab = new RoleAssignmentsTab(page, "user");
    await tab.add(roles);
    await expect(
      toasts.success(`2 roles added to user "${username}"`),
    ).toBeVisible();
    await expect(detail.rolesTab).toHaveText("Roles (2)");
    // A role already held as a global assignment can't be added again.
    await detail.expectRoleNotSelectable(roles[0]);
  });

  test("USR-ROL-03 remove one assignment of a role assigned twice", async ({
    page,
    api,
    cleanup,
  }) => {
    test.slow();
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    const role = cleanup.role(`file.${uniqueName("role")}`);
    await api.createRole({
      name: role,
      permissions: ["file.view_filerepository"],
    });
    const repo = cleanup.repository(uniqueName("repo"));
    const { pulp_href } = await api.createFileRepository(repo);
    await api.assignRole({ user: username }, { role });
    await api.assignRole(
      { user: username },
      { role, contentObject: pulp_href },
    );

    await openDetail(page, api, username);
    const tab = new RoleAssignmentsTab(page, "user");
    await tab.open();
    await expect(tab.rows(role)).toHaveCount(2);
    await tab.remove(tab.rows(role).first());
    await expect(tab.rows(role)).toHaveCount(1);
    await expect
      .poll(async () => (await api.roleAssignments({ user: username })).length)
      .toBe(1);
  });
});
