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

  test("GRP-DET-01 header, tabs and counts", async ({ api, cleanup, page }) => {
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
  });

  test("GRP-DET-04 opening a group detail page directly", async ({
    page,
    context,
    api,
    cleanup,
  }) => {
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
    await breadcrumb.getByRole("link", { name: "Groups", exact: true }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Groups", exact: true }),
    ).toBeVisible();

    for (const bad of ["999999999", "abc"]) {
      await page.goto(`/admin/groups/${bad}`);
      await expect(
        page.getByRole("heading", { name: "404: That page does not exist" }),
      ).toBeVisible();
    }
    const gone = await seedGroup(api, cleanup);
    await api.deleteGroup(gone.name);
    await page.goto(`/admin/groups/${gone.id}`);
    await expect(
      page.getByRole("heading", { name: "404: That page does not exist" }),
    ).toBeVisible();
  });

  test("GRP-DET-05 a non-superuser and the group detail URL", async ({
    api,
    cleanup,
    secondUser,
  }) => {
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
      page.getByRole("heading", { name: "404: That page does not exist" }),
    ).toBeVisible();
    // A group they may view opens (the POM waits out the detail-route load).
    await GroupDetailPage.open(page, viewable);
  });

  test("GRP-DEL-04 deleting from the detail page", async ({
    page,
    api,
    cleanup,
    toasts,
  }) => {
    const group = await seedGroup(api, cleanup);
    const detail = await GroupDetailPage.open(page, group);
    const notFound = recordApiNotFound(page);
    await detail.deleteGroup();
    await expect(toasts.success(`Group "${group.name}" deleted`)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/groups\/?$/);
    expect(
      notFound.filter((url) => url.includes(`/groups/${group.id}/`)),
    ).toEqual([]);
  });

  // --- Users tab ----------------------------------------------------------

  test("GRP-USR-03 add and remove users", async ({
    api,
    cleanup,
    page,
    toasts,
  }) => {
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
    for (const username of usernames) await modal.select("Username", username);
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
  });

  test("GRP-USR-05 the Add User modal filters, sorts and pages; the Users tab pages only", async ({
    api,
    cleanup,
    page,
  }) => {
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
    await detail.users.row(member).getByRole("link", { name: member }).click();
    await expect(new UserDetailPage(page, member).title).toBeVisible();
  });

  test("GRP-USR-06 adding a user grants the group's roles, removing takes them away", async ({
    api,
    cleanup,
    page,
    secondUser,
  }) => {
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
  });

  // --- Roles tab ----------------------------------------------------------

  test("GRP-ROL-01 role assignment rows, add and remove", async ({
    api,
    cleanup,
    page,
    toasts,
  }) => {
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
  });

  test("GRP-ROL-02 a non-superuser who may view a group cannot read its role assignments", async ({
    api,
    cleanup,
    secondUser,
  }) => {
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
    await expect(tab.table.stateHeading("403: Access denied")).toBeVisible();
    await expect(tab.addButton()).toBeEnabled();
    const modal = await tab.openAdd();
    await expect(modal.table.stateHeading("403: Access denied")).toBeVisible();
  });
});
