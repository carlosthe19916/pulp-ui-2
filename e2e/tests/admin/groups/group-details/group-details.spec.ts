import { expect, test } from "@support/fixtures";
import { delayApi } from "@support/helpers/delayApi";
import {
  NO_CHANGE,
  expectGate,
  grantOnGroup,
  permissionsFor,
  repositoryEditItem,
  seedGroup,
  seedRepositoryChangedThroughGroup,
} from "@support/helpers/groups";
import { recordApiNotFound } from "@support/helpers/notFound";
import { uniqueName } from "@support/helpers/unique";
import { BatchAddModal } from "@support/pom/BatchAddModal";
import { GroupDetailPage } from "@support/pom/GroupDetailPage";
import { RoleAssignmentsTab } from "@support/pom/RoleAssignmentsTab";
import { UserDetailPage } from "@support/pom/UserDetailPage";

// Scenarios: e2e/specs/groups.md (detail page, Users tab, Roles tab).

test.describe("Groups", () => {
  test.slow();

  // --- Detail page --------------------------------------------------------

  /**
   * GRP-DET-01 · Header, tabs and counts
   *
   * Summary: A group's detail page shows the name header, Edit/Delete actions, and Users/Roles tabs with their real counts.
   *
   * When I open a group's detail page
   * Then the header shows the group name, an actions menu with "Edit Group" and "Delete Group", and
   * tabs "Users (n)" and "Roles (n)" with Users selected, where n is the real total (a group with 1
   * user and 12 role assignments reads "Users (1)" and "Roles (12)" — 12 is above a page, so it
   * proves totals, not visible rows)
   */
  test(
    "A group's detail page shows the name header, Edit/Delete actions, and Users/Roles tabs with their real counts.",
    {
      tag: "@GRP-DET-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-DET-01",
      },
    },
    async ({ api, cleanup, page }) => {
      const group = await seedGroup(api, cleanup);
      // 1 user and 12 role assignments: 12 is above a page, proving the count is the total.
      const member = cleanup.user(uniqueName("user"));
      await api.createUser({ username: member });
      await api.addGroupMember(group.name, member);
      const roles = Array.from({ length: 12 }, () =>
        cleanup.role(uniqueName("role")),
      );
      for (const role of roles) {
        await api.createRole({ name: role });
        await api.assignRole({ group: group.name }, { role });
      }

      const detail = await GroupDetailPage.open(page, group);
      await expect(detail.usersTab).toHaveText("Users (1)");
      await expect(detail.usersTab).toHaveAttribute("aria-selected", "true");
      await expect(detail.rolesTab).toHaveText("Roles (12)");
      await detail.actionsMenuItem("Edit Group");
      await expect(page.getByRole("menuitem")).toHaveText([
        "Edit Group",
        "Delete Group",
      ]);
    },
  );

  /**
   * GRP-DET-04 · Opening a group detail page directly
   *
   * Summary: Opening a group's detail URL directly loads it with the browser tab title and breadcrumb, and 404s for bad ids.
   *
   * When I open a group's detail URL (new tab, and reload)
   * Then the detail page shows the group name in the header and the browser tab title "Group · <name>"
   * And on a slow network "Loading group" shows until the content replaces it
   * And the breadcrumb reads "Groups › <name>" with <name> not a link; clicking "Groups" opens the list
   * And a URL whose id does not exist, is non-numeric, or belongs to a deleted group shows "404: That
   * page does not exist"
   */
  test(
    "Opening a group's detail URL directly loads it with the browser tab title and breadcrumb, and 404s for bad ids.",
    {
      tag: "@GRP-DET-04",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-DET-04",
      },
    },
    async ({ page, context, api, cleanup }) => {
      const group = await seedGroup(api, cleanup);

      // The POM's open() waits out the slow detail-route load.
      const tab = await context.newPage();
      await GroupDetailPage.open(tab, group);
      await expect(tab).toHaveTitle(new RegExp(`^Group · ${group.name} · `));
      await tab.close();

      const held = await delayApi(page, {
        url: (url) => url.pathname.endsWith(`/groups/${group.id}/`),
        method: "GET",
      });
      await page.goto(`/admin/groups/${group.id}`);
      await expect(
        page.getByRole("progressbar", { name: "Loading group" }),
      ).toBeVisible();
      held.release();
      await expect(
        page.getByRole("heading", { level: 1, name: group.name }),
      ).toBeVisible();

      const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
      await expect(breadcrumb.getByRole("listitem")).toHaveText([
        "Groups",
        group.name,
      ]);
      await breadcrumb
        .getByRole("link", { name: "Groups", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Groups", exact: true }),
      ).toBeVisible();

      for (const bad of ["999999999", "abc"]) {
        await page.goto(`/admin/groups/${bad}`);
        await expect(
          page.getByRole("heading", {
            name: "404: That page no longer exists",
          }),
        ).toBeVisible();
      }
      const gone = await seedGroup(api, cleanup);
      await api.deleteGroup(gone.name);
      await page.goto(`/admin/groups/${gone.id}`);
      await expect(
        page.getByRole("heading", { name: "404: That page no longer exists" }),
      ).toBeVisible();
    },
  );

  /**
   * GRP-DET-05 · A non-superuser and the group detail URL
   *
   * Summary: A non-superuser gets a 404 for a group they can't see and the detail page for one they may view.
   *
   * Auth: second-user
   *
   * Given a second user with no permission on a group
   * When they open that group's detail URL
   * Then "404: That page no longer exists" is displayed (a group they can't see does not exist)
   * When they open the detail URL of a group they may view
   * Then the detail page opens
   */
  test(
    "A non-superuser gets a 404 for a group they can't see and the detail page for one they may view.",
    {
      tag: "@GRP-DET-05",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-DET-05",
      },
    },
    async ({ api, cleanup, secondUser }) => {
      const user = await secondUser.create();
      const hidden = await seedGroup(api, cleanup);
      const viewable = await seedGroup(api, cleanup);
      await grantOnGroup(api, cleanup, {
        username: user.username,
        group: viewable,
        permissions: permissionsFor({ change: false, del: false }),
      });
      const page = await secondUser.login(user);
      await page.goto(`/admin/groups/${hidden.id}`);
      await expect(
        page.getByRole("heading", { name: "404: That page no longer exists" }),
      ).toBeVisible();
      // A group they may view opens (the POM waits out the detail-route load).
      await GroupDetailPage.open(page, viewable);
    },
  );

  /**
   * GRP-DEL-04 · Deleting from the detail page
   *
   * Summary: Deleting a group from its detail page returns to the list with no stale request for the gone group.
   *
   * When I delete a group from its detail page
   * Then the dialog is the same as from the list, the Groups list opens afterwards, and no request
   * for the deleted group answers 404
   */
  test(
    "Deleting a group from its detail page returns to the list with no stale request for the gone group.",
    {
      tag: "@GRP-DEL-04",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-DEL-04",
      },
    },
    async ({ page, api, cleanup, toasts }) => {
      const group = await seedGroup(api, cleanup);
      const detail = await GroupDetailPage.open(page, group);
      const notFound = recordApiNotFound(page);
      await detail.deleteGroup();
      await expect(
        toasts.success(`Group "${group.name}" deleted`),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/groups\/?$/);
      expect(
        notFound.filter((url) => url.includes(`/groups/${group.id}/`)),
      ).toEqual([]);
    },
  );

  // --- Users tab ----------------------------------------------------------

  /**
   * GRP-USR-03 · Add and remove users
   *
   * Summary: On a group's Users tab, adding and removing users updates the list and count and shows the right toasts.
   *
   * When I open the Users tab and click "Add User"
   * Then the "Add User to Group" modal lists users, with a disabled checkbox on users already in the
   * group
   * When I select users and click "Add (n)"
   * Then the toast `<n> user(s) added to group "<name>"` appears, the modal closes, the users are
   * listed in the Users tab, and the "Users (n)" count rises by n
   * When I remove a user
   * Then the dialog "Remove User" shows `Are you sure you want to remove user "<username>" from group
   * "<group>"?`; confirming shows the toast `User "<username>" removed from group "<group>"`, drops the
   * row and lowers the count by one
   * And "Add User" and "Remove" follow the same gate as the list actions
   */
  test(
    "On a group's Users tab, adding and removing users updates the list and count and shows the right toasts.",
    {
      tag: "@GRP-USR-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-USR-03",
      },
    },
    async ({ api, cleanup, page, toasts }) => {
      const group = await seedGroup(api, cleanup);
      const usernames = [
        cleanup.user(uniqueName("user")),
        cleanup.user(uniqueName("user")),
      ];
      for (const username of usernames) await api.createUser({ username });
      const detail = await GroupDetailPage.open(page, group);
      await detail.addUserButton().click();
      const modal = new BatchAddModal(page, {
        title: "Add User to Group",
        grid: "Select users",
      });
      for (const username of usernames)
        await modal.select("Username", username);
      await modal.addButton().click();
      await expect(modal.dialog).toBeHidden();
      await expect(
        toasts.success(`2 users added to group "${group.name}"`),
      ).toBeVisible();
      for (const username of usernames)
        await expect(detail.users.row(username)).toBeVisible();
      await expect(detail.usersTab).toHaveText("Users (2)");

      await detail.removeUser(usernames[0]);
      await expect(
        toasts.success(
          `User "${usernames[0]}" removed from group "${group.name}"`,
        ),
      ).toBeVisible();
      await expect(detail.usersTab).toHaveText("Users (1)");
      await expect
        .poll(() => api.groupMemberNames(group.name))
        .toEqual([usernames[1]]);
    },
  );

  /**
   * GRP-USR-05 · The Add User modal filters, sorts and pages
   *
   * Summary: The Add User modal filters, sorts and pages its candidate list; the Users tab itself only pages, with username links.
   *
   * Seed: more than two pages of users
   *
   * When I open the "Add User" modal
   * Then its table sorts by Username ascending, filters by Username, sorts by Username and Email, and
   * pages — the rows narrowing and reordering accordingly
   * And the Users tab itself only pages (Pulp does not guarantee a group's member order, so a test
   * must not depend on it); each username links to its user detail page
   */
  test(
    "The Add User modal filters, sorts and pages its candidate list; the Users tab itself only pages, with username links.",
    {
      tag: "@GRP-USR-05",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-USR-05",
      },
    },
    async ({ api, cleanup, page }) => {
      const group = await seedGroup(api, cleanup);
      const member = cleanup.user(uniqueName("user"));
      await api.createUser({ username: member });
      await api.addGroupMember(group.name, member);
      // 12 candidate users sharing a token: more than one page in the Add User modal.
      const token = uniqueName("su").slice(-8);
      const names = Array.from({ length: 12 }, (_, i) =>
        cleanup.user(`e2e-${token}-u${String(i).padStart(2, "0")}`),
      );
      for (let i = 0; i < names.length; i += 6) {
        await Promise.all(
          names.slice(i, i + 6).map((username) => api.createUser({ username })),
        );
      }

      const detail = await GroupDetailPage.open(page, group);

      // The Add User modal filters, sorts and pages.
      await detail.addUserButton().click();
      const modal = new BatchAddModal(page, {
        title: "Add User to Group",
        grid: "Select users",
      });
      await modal.table.expectSorted("Username", "ascending");
      await modal.table.filter("Username", token);
      await expect
        .poll(async () => (await modal.table.paginator().range()).total)
        .toBe(12);
      await modal.table.sortBy("Email");
      await modal.table.expectSorted("Email", "ascending");
      await modal.close("Cancel");

      // The Users tab pages only (no filter or sort), and usernames link to the user.
      await expect(detail.users.row(member)).toBeVisible();
      await expect(
        page.getByRole("tabpanel").getByPlaceholder(/^Filter by/),
      ).toHaveCount(0);
      await expect(
        detail.users.grid.getByRole("columnheader").getByRole("button"),
      ).toHaveCount(0);
      await detail.users
        .row(member)
        .getByRole("link", { name: member })
        .click();
      await expect(new UserDetailPage(page, member).title).toBeVisible();
    },
  );

  /**
   * GRP-USR-06 · Adding a user grants the group's roles
   *
   * Summary: Adding a user to a group grants them the group's roles (their gated actions enable); removing revokes them.
   *
   * Auth: second-user
   *
   * Given group G has a role that lets members change repositories
   * When I add the second user to G
   * Then their repository change actions become enabled
   * When I remove them from G
   * Then those actions become disabled again
   */
  test(
    "Adding a user to a group grants them the group's roles (their gated actions enable); removing revokes them.",
    {
      tag: "@GRP-USR-06",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-USR-06",
      },
    },
    async ({ api, cleanup, page, secondUser }) => {
      const user = await secondUser.create();
      const { repo, group } = await seedRepositoryChangedThroughGroup(
        api,
        cleanup,
        user.username,
      );
      const userPage = await secondUser.login(user);
      await expectGate(await repositoryEditItem(userPage, repo), {
        tooltip: NO_CHANGE,
      });

      const detail = await GroupDetailPage.open(page, group);
      await detail.addUser(user.username);
      await expectGate(await repositoryEditItem(userPage, repo), "enabled");

      await detail.removeUser(user.username);
      await expectGate(await repositoryEditItem(userPage, repo), {
        tooltip: NO_CHANGE,
      });
    },
  );

  // --- Roles tab ----------------------------------------------------------

  /**
   * GRP-ROL-01 · Role assignment rows, add and remove
   *
   * Summary: On a group's Roles tab, role assignments show their details and can be added and removed with the right toasts.
   *
   * When I open the Roles tab
   * Then each row shows the role name, its Description (or "—"), its Permissions count and a formatted
   * Created date, sorted by Role ascending, and an empty tab shows "No roles assigned to this group"
   * When I add roles with "Add Role" (the "Add Role to Group" modal, roles already held globally
   * disabled)
   * Then the toast `<n> role(s) added to group "<name>"` appears and they are listed with a new
   * Created date
   * When I remove a role
   * Then the dialog "Remove Role" shows `Are you sure you want to remove role "<role>" from group
   * "<group>"?`; confirming shows the toast `Role "<role>" removed from group "<group>"` and drops the
   * row
   */
  test(
    "On a group's Roles tab, role assignments show their details and can be added and removed with the right toasts.",
    {
      tag: "@GRP-ROL-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-ROL-01",
      },
    },
    async ({ api, cleanup, page, toasts }) => {
      const group = await seedGroup(api, cleanup);
      const detail = await GroupDetailPage.open(page, group);
      const tab = new RoleAssignmentsTab(page, "group");
      await tab.open();
      await expect(
        tab.table.stateHeading("No roles assigned to this group"),
      ).toBeVisible();

      const role = cleanup.role(`file.${uniqueName("role")}`);
      await api.createRole({
        name: role,
        description: "Views repositories",
        permissions: ["file.view_filerepository"],
      });
      await tab.add([role]);
      await expect(
        toasts.success(`1 role added to group "${group.name}"`),
      ).toBeVisible();
      const cells = tab.rows(role).getByRole("gridcell");
      await expect(cells.nth(0)).toHaveText(role);
      await expect(cells.nth(1)).toHaveText("Views repositories");
      await expect(cells.nth(2)).toHaveText("1");
      await expect(cells.nth(3)).toHaveText(/\d/);

      await detail.removeRole(role);
      await expect(
        toasts.success(`Role "${role}" removed from group "${group.name}"`),
      ).toBeVisible();
    },
  );

  /**
   * GRP-ROL-02 · A non-superuser who may view a group cannot read its role assignments
   *
   * Summary: A non-superuser who may view a group still sees “Access permissions needed” on its Roles tab and Add Role modal.
   *
   * Auth: second-user
   *
   * Given a second user who may view group G but is not a superuser
   * When they open G's detail page
   * Then the tab reads "Roles (0)" and the Roles tab table shows "Access permissions needed"
   * And "Add Role" is enabled, but its modal table shows "Access permissions needed" too
   */
  test(
    "A non-superuser who may view a group still sees “Access permissions needed” on its Roles tab and Add Role modal.",
    {
      tag: "@GRP-ROL-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-ROL-02",
      },
    },
    async ({ api, cleanup, secondUser }) => {
      const group = await seedGroup(api, cleanup);
      const viewer = await secondUser.create();
      await api.assignRole(
        { user: viewer.username },
        { role: "core.group_viewer", contentObject: group.pulp_href },
      );
      const page = await secondUser.login(viewer);
      await page.goto(`/admin/groups/${group.id}`);
      await expect(
        page.getByRole("heading", { level: 1, name: group.name }),
      ).toBeVisible();
      const tab = new RoleAssignmentsTab(page, "group");
      await expect(tab.tab).toHaveText("Roles (0)");
      await tab.open();
      await expect(
        tab.table.stateHeading("Access permissions needed"),
      ).toBeVisible();
      await expect(tab.addButton()).toBeEnabled();
      const modal = await tab.openAdd();
      await expect(
        modal.table.stateHeading("Access permissions needed"),
      ).toBeVisible();
    },
  );
});
