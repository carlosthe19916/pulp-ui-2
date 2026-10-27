import { expect, test } from "@support/fixtures";
import { delayApi } from "@support/helpers/delayApi";
import { recordApiNotFound } from "@support/helpers/notFound";
import { uniqueName } from "@support/helpers/unique";
import { COL, cell, groupId, openDetail } from "@support/helpers/users";
import { RoleAssignmentsTab } from "@support/pom/RoleAssignmentsTab";
import { UserDetailPage } from "@support/pom/UserDetailPage";

// Scenarios: e2e/specs/users.md (detail page, Groups tab, Roles tab).

test.describe("Users", () => {
  // --- Detail page --------------------------------------------------------

  /**
   * USR-DET-01 · Header, tabs and counts
   *
   * Summary: A user's detail page shows the username header, Edit/Delete actions, and Groups/Roles tabs with their real counts.
   *
   * When I open a user's detail page
   * Then the header shows the username, an actions menu with "Edit User" and "Delete User", and tabs
   * "Groups (n)" and "Roles (n)" with Groups selected, where n is the real total (a user in 1 group
   * with 12 role assignments reads "Groups (1)" and "Roles (12)" — 12 is above a page, so it proves
   * totals, not visible rows)
   */
  test(
    "A user's detail page shows the username header, Edit/Delete actions, and Groups/Roles tabs with their real counts.",
    {
      tag: "@USR-DET-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-DET-01",
      },
    },
    async ({ page, api, cleanup }) => {
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
      await expect(
        page.getByRole("tab", { name: "Groups (1)" }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tab", { name: "Roles (12)" })).toBeVisible();
    },
  );

  /**
   * USR-DET-06 · Opening a user detail page directly
   *
   * Summary: Opening a user's detail URL directly (new tab or reload) loads it with the browser tab title and a working breadcrumb.
   *
   * When I open a user's detail URL (by typing it in a new tab, and by reloading the page)
   * Then the detail page shows the username in the header and the browser tab title "User · <name>"
   * And on a slow network "Loading user" shows until the content replaces it
   * And the breadcrumb reads "Users › <name>" with <name> not a link; clicking "Users" opens the
   * Users list
   */
  test(
    "Opening a user's detail URL directly (new tab or reload) loads it with the browser tab title and a working breadcrumb.",
    {
      tag: "@USR-DET-06",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-DET-06",
      },
    },
    async ({ page, context, api, cleanup }) => {
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
      await breadcrumb
        .getByRole("link", { name: "Users", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Users", exact: true }),
      ).toBeVisible();
    },
  );

  /**
   * USR-DET-07 · Detail-route errors show 404
   *
   * Summary: A user detail URL with a missing, non-numeric or deleted id shows “404: That page no longer exists”.
   *
   * When I open a user detail URL whose id does not exist, is non-numeric (`abc`), or belongs to a
   * deleted user
   * Then "404: That page no longer exists" is displayed instead of the detail page
   */
  test(
    "A user detail URL with a missing, non-numeric or deleted id shows “404: That page no longer exists”.",
    {
      tag: "@USR-DET-07",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-DET-07",
      },
    },
    async ({ page, api, cleanup }) => {
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
            page.getByRole("heading", {
              name: "404: That page no longer exists",
            }),
          ).toBeVisible();
        });
      }
    },
  );

  /**
   * USR-DET-08 · A non-superuser cannot open a user detail page
   *
   * Summary: A non-superuser opening a user's detail URL sees “Access permissions needed”.
   *
   * Auth: second-user
   *
   * Given a second user with no permission on users
   * When they open an existing user detail URL
   * Then "Access permissions needed" is displayed (users are superuser-only)
   */
  test(
    "A non-superuser opening a user's detail URL sees “Access permissions needed”.",
    {
      tag: "@USR-DET-08",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-DET-08",
      },
    },
    async ({ api, cleanup, secondUser }) => {
      const username = cleanup.user(uniqueName("user"));
      const { id } = await api.createUser({ username });
      const user = await secondUser.create();
      const page = await secondUser.login(user);
      await page.goto(`/admin/users/${id}`);
      await expect(
        page.getByRole("heading", { name: "Access permissions needed" }),
      ).toBeVisible();
    },
  );

  /**
   * USR-DEL-05 · Deleting from the detail page
   *
   * Summary: Deleting a user from its detail page returns to the list with no stale request for the gone user.
   *
   * When I delete a user from its detail page
   * Then the dialog is the same as from the list, the Users list opens afterwards, and no request
   * for the deleted user answers 404
   */
  test(
    "Deleting a user from its detail page returns to the list with no stale request for the gone user.",
    {
      tag: "@USR-DEL-05",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-DEL-05",
      },
    },
    async ({ page, api, cleanup, toasts }) => {
      const username = cleanup.user(uniqueName("user"));
      const { id } = await api.createUser({ username });
      const detail = new UserDetailPage(page, username);
      await detail.goto(id);
      const notFound = recordApiNotFound(page);
      await detail.deleteUser();
      await expect(toasts.success(`User "${username}" deleted`)).toBeVisible();
      // The list opens, and nothing refetches the deleted user.
      await expect(page).toHaveURL(/\/admin\/users\/?$/);
      expect(notFound.filter((url) => url.includes(`/users/${id}/`))).toEqual(
        [],
      );
    },
  );

  // --- Groups tab ---------------------------------------------------------

  /**
   * USR-GRP-03 · Add and remove a group
   *
   * Summary: On a user's Groups tab, adding and removing a group updates the list and count and shows the right toasts.
   *
   * When I open the Groups tab and click "Add Group"
   * Then the "Add User to Group" modal lists groups, with a disabled checkbox on groups the user
   * already belongs to
   * When I select one or more groups and click "Add (n)"
   * Then the toast `<n> group(s) added to user "<username>"` appears, the modal closes, the groups
   * are listed in the Groups tab, and the "Groups (n)" count rises by n
   * When I remove a group
   * Then the dialog "Remove Group" shows `Are you sure you want to remove user "<username>" from
   * group "<group>"?`; confirming shows the toast `User "<username>" removed from group "<group>"`,
   * drops the row and lowers the count by one
   * And "Add Group" and "Remove" are always enabled here (a user's detail page is superuser-only, and
   * a superuser may always change a group's members)
   */
  test(
    "On a user's Groups tab, adding and removing a group updates the list and count and shows the right toasts.",
    {
      tag: "@USR-GRP-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-GRP-03",
      },
    },
    async ({ page, api, cleanup, toasts }) => {
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
    },
  );

  /**
   * USR-GRP-05 · Both sides stay in sync
   *
   * Summary: A membership added or removed from the user's Groups tab is reflected on the group's Users tab and the Users list count.
   *
   * This is the one representative of user↔group cross-page sync.
   *
   * | done on                        | then shown on                                  |
   * | ------------------------------ | ---------------------------------------------- |
   * | user › Groups › add group G    | G › Users lists the user; Users list Groups +1 |
   * | user › Groups › remove group G | G › Users no longer lists the user             |
   */
  test(
    "user › Groups › add group G shows on G and in the Users list",
    {
      tag: "@USR-GRP-05",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-GRP-05",
      },
    },
    async ({ page, api, cleanup }) => {
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
    },
  );

  /**
   * USR-GRP-05 · Both sides stay in sync
   *
   * Summary: A membership added or removed from the user's Groups tab is reflected on the group's Users tab and the Users list count.
   *
   * This is the one representative of user↔group cross-page sync.
   *
   * | done on                        | then shown on                                  |
   * | ------------------------------ | ---------------------------------------------- |
   * | user › Groups › add group G    | G › Users lists the user; Users list Groups +1 |
   * | user › Groups › remove group G | G › Users no longer lists the user             |
   */
  test(
    "user › Groups › remove group G no longer shows on G",
    {
      tag: "@USR-GRP-05",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-GRP-05",
      },
    },
    async ({ page, api, cleanup }) => {
      const username = cleanup.user(uniqueName("user"));
      const group = cleanup.group(uniqueName("group"));
      await api.createUser({ username });
      await api.createGroup(group);
      await api.addGroupMember(group, username);
      const detail = await openDetail(page, api, username);
      await detail.removeGroup(group);
      await page.goto(`/admin/groups/${await groupId(api, group)}`);
      await expect(page.getByRole("tab", { name: "Users (0)" })).toBeVisible();
    },
  );

  /**
   * USR-GRP-07 · The Groups tab empty state
   *
   * Summary: A user in no groups shows the “User is not a member of any group” empty state on the Groups tab.
   *
   * Given a user who belongs to no group
   * When I open their Groups tab
   * Then "User is not a member of any group" shows with no action button
   */
  test(
    "A user in no groups shows the “User is not a member of any group” empty state on the Groups tab.",
    {
      tag: "@USR-GRP-07",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-GRP-07",
      },
    },
    async ({ page, api, cleanup }) => {
      const username = cleanup.user(uniqueName("user"));
      await api.createUser({ username });
      await api.createGroup(cleanup.group(uniqueName("group")));
      const detail = await openDetail(page, api, username);
      await expect(
        detail.groups.stateHeading("User is not a member of any group"),
      ).toBeVisible();
      await expect(detail.groups.rows).toHaveCount(1);
    },
  );

  // --- Roles tab ----------------------------------------------------------

  /**
   * USR-ROL-01 · Role assignment rows, filtering, sorting and paging
   *
   * Summary: The user's Roles tab shows each assignment's role, description, permissions and created date, and filters, sorts and pages.
   *
   * Seed: a user with more than two pages of role assignments
   *
   * When I open the Roles tab
   * Then the column headers are Role, Description, Permissions, Created, actions, and each row shows
   * the role name (plain text), its Description (or "—"), its Permissions count and a formatted
   * Created date, sorted by Role ascending
   * When I filter by Role, and sort by Role, Description and Created
   * Then the rows narrow and reorder accordingly, on page 1, with the item total matching
   * And a user with no role assignments shows "No roles assigned to this user"
   */
  test(
    "The user's Roles tab shows each assignment's role, description, permissions and created date, and filters, sorts and pages.",
    {
      tag: "@USR-ROL-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-ROL-01",
      },
    },
    async ({ page, api, cleanup }) => {
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
    },
  );

  /**
   * USR-ROL-02 · Add roles
   *
   * Summary: Adding roles to a user from the Roles tab toasts, lists them and raises the count; an already-held role can't be re-added.
   *
   * When I open the Roles tab and click "Add Role"
   * Then the "Add Role to User" modal lists roles, with a disabled checkbox on roles the user already
   * holds as a global assignment (an object- or domain-scoped assignment, and an unassigned role,
   * stay selectable)
   * When I select roles and click "Add (n)"
   * Then the toast `<n> role(s) added to user "<username>"` appears, the modal closes, the roles are
   * listed with a new Created date, and the "Roles (n)" count rises by n
   */
  test(
    "Adding roles to a user from the Roles tab toasts, lists them and raises the count; an already-held role can't be re-added.",
    {
      tag: "@USR-ROL-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-ROL-02",
      },
    },
    async ({ page, api, cleanup, toasts }) => {
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
    },
  );

  /**
   * USR-ROL-03 · Remove one assignment of a role assigned twice
   *
   * Summary: Removing one of two assignments of the same role leaves the other in place.
   *
   * Given the user holds role R globally and on one repository
   * When I remove one of the R rows
   * Then the toast `Role "<role>" removed from user "<username>"` appears, only that assignment is
   * gone, and the other R row stays
   */
  test(
    "Removing one of two assignments of the same role leaves the other in place.",
    {
      tag: "@USR-ROL-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-ROL-03",
      },
    },
    async ({ page, api, cleanup }) => {
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
        .poll(
          async () => (await api.roleAssignments({ user: username })).length,
        )
        .toBe(1);
    },
  );
});
