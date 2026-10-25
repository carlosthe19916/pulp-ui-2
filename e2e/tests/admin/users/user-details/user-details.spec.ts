import { expect, test } from "../../../fixtures";
import { uniqueName } from "../../../helpers/unique";
import { COL, cell, groupId, openDetail } from "../../../helpers/users";
import { BatchAddModal } from "../../../pom/BatchAddModal";

test.describe("Users", () => {
  // --- Detail page --------------------------------------------------------

  test("USR-DET-01 header, actions and tabs", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
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
    await expect(page.getByRole("tab", { name: "Groups (0)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tab", { name: "Roles (0)" })).toBeVisible();
  });

  test("USR-DET-02 tab counts", async ({ page, api, cleanup }) => {
    test.setTimeout(300_000);
    // Twelve groups and roles, more than a page, shared by every row.
    const seededGroups = Array.from({ length: 12 }, () =>
      cleanup.group(uniqueName("group")),
    );
    const seededRoles = Array.from({ length: 12 }, () =>
      cleanup.role(uniqueName("role")),
    );
    await Promise.all([
      ...seededGroups.map((group) => api.createGroup(group)),
      ...seededRoles.map((role) => api.createRole({ name: role })),
    ]);

    // Main cases (each count value once; 12 is above a page, proving totals).
    for (const [groups, roles] of [
      [0, 0],
      [1, 12],
      [12, 1],
    ]) {
      await test.step(`${groups} groups and ${roles} roles`, async () => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({ username });
        await Promise.all([
          ...seededGroups
            .slice(0, groups)
            .map((group) => api.addGroupMember(group, username)),
          ...seededRoles
            .slice(0, roles)
            .map((role) => api.assignRole({ user: username }, { role })),
        ]);
        await openDetail(page, api, username);
        await expect(
          page.getByRole("tab", { name: `Groups (${groups})` }),
        ).toBeVisible();
        await expect(
          page.getByRole("tab", { name: `Roles (${roles})` }),
        ).toBeVisible();
      });
    }
  });

  // Main cases (add +1/+2 and remove −1, across the two tabs).
  const countRows = [
    { action: "add two groups", tab: "Groups", change: 2 },
    { action: "remove one group", tab: "Groups", change: -1 },
    { action: "add one role", tab: "Roles", change: 1 },
  ] as const;
  test("USR-DET-03 adding and removing updates the tab count", async ({
    page,
    api,
    cleanup,
  }) => {
    test.slow();
    for (const row of countRows) {
      await test.step(`${row.action} updates ${row.tab} (n) by ${row.change}`, async () => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({ username });
        const isGroup = row.tab === "Groups";
        const names = [0, 1].map(() =>
          isGroup
            ? cleanup.group(uniqueName("group"))
            : cleanup.role(uniqueName("role")),
        );
        for (const name of names) {
          if (isGroup) await api.createGroup(name);
          else await api.createRole({ name });
        }
        const removing = row.change < 0;
        const start = removing ? 2 : 0;
        if (removing) {
          for (const name of names) {
            if (isGroup) await api.addGroupMember(name, username);
            else await api.assignRole({ user: username }, { role: name });
          }
        }

        const detail = await openDetail(page, api, username);
        const tab = isGroup ? detail.groupsTab : detail.rolesTab;
        await tab.click();
        await expect(tab).toHaveText(`${row.tab} (${start})`);

        if (removing) {
          if (isGroup) await detail.removeGroup(names[0]);
          else await detail.removeRole(names[0]);
        } else {
          await page
            .getByRole("button", {
              name: isGroup ? "Add Group" : "Add Role",
              exact: true,
            })
            .click();
          const modal = new BatchAddModal(
            page,
            isGroup
              ? { title: "Add User to Group", grid: "Select groups" }
              : { title: "Add Role to User", grid: "Select roles" },
          );
          for (const name of names.slice(0, row.change)) {
            await modal.select(isGroup ? "Name" : "Role", name);
          }
          await modal.addButton().click();
          await expect(modal.dialog).toBeHidden();
        }
        await expect(tab).toHaveText(`${row.tab} (${start + row.change})`);
      });
    }
  });

  test("USR-DET-05 switching tabs keeps each tab's own table and filter", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    const detail = await openDetail(page, api, username);
    await expect(detail.groupsTable).toBeVisible();
    await detail.groups.filterInput("Name").fill("only-in-groups");

    await detail.rolesTab.click();
    await expect(detail.rolesTable).toBeVisible();
    await expect(detail.groupsTable).toBeHidden();
    await expect(detail.roles.filterInput("Role")).toHaveValue("");

    await detail.groupsTab.click();
    await expect(detail.groupsTable).toBeVisible();
    await expect(detail.rolesTable).toBeHidden();
  });

  // --- Groups tab ---------------------------------------------------------

  test("USR-GRP-01 only the user's own groups are listed", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    const [inA, inB, outside] = [0, 1, 2].map(() =>
      cleanup.group(uniqueName("group")),
    );
    for (const group of [inA, inB, outside]) await api.createGroup(group);
    await api.addGroupMember(inA, username);
    await api.addGroupMember(inB, username);

    const detail = await openDetail(page, api, username);
    await expect(detail.groups.rows).toHaveCount(2);
    await expect(detail.groups.row(inA)).toBeVisible();
    await expect(detail.groups.row(inB)).toBeVisible();
    await expect(detail.groups.row(outside)).toHaveCount(0);
  });

  test("USR-GRP-02 a user with no groups shows the empty state", async ({
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
    await detail.addGroup(group);
    await expect(
      toasts.success(`1 group added to user "${username}"`),
    ).toBeVisible();
    await detail.removeGroup(group);
    await expect(
      toasts.success(`User "${username}" removed from group "${group}"`),
    ).toBeVisible();
    await expect.poll(() => api.userGroupNames(username)).toEqual([]);
  });

  test("USR-GRP-04 Remove is enabled on every group", async ({
    page,
    api,
    cleanup,
    secondUser,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    // One group the admin owns and one it holds no role on.
    const owned = cleanup.group(uniqueName("group"));
    await api.createGroup(owned);
    await api.addGroupMember(owned, username);
    const creator = await secondUser.create();
    const role = cleanup.role(uniqueName("role"));
    await api.createRole({ name: role, permissions: ["core.add_group"] });
    await api.assignRole({ user: creator.username }, { role });
    const foreign = cleanup.group(uniqueName("group"));
    const creatorPage = await secondUser.login(creator);
    const response = await creatorPage.request.post(
      `/api/pulp/${api.domainEnabled ? "default/" : ""}api/v3/groups/`,
      {
        data: { name: foreign },
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${creator.username}:${creator.password}`).toString(
              "base64",
            ),
        },
      },
    );
    expect(response.ok()).toBe(true);
    await api.addGroupMember(foreign, username);

    const detail = await openDetail(page, api, username);
    for (const group of [owned, foreign]) {
      await detail.groups
        .row(group)
        .getByRole("button", { name: "Kebab toggle" })
        .click();
      await expect(
        page.getByRole("menuitem", { name: "Remove", exact: true }),
      ).not.toHaveAttribute("aria-disabled", "true");
      await page.keyboard.press("Escape");
    }
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

  test("USR-GRP-06 Add Group is always enabled", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    await openDetail(page, api, username);
    await expect(
      page.getByRole("button", { name: "Add Group", exact: true }),
    ).toBeEnabled();
  });
});
