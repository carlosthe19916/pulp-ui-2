import { expect, test } from "../../../fixtures";
import {
  NO_CHANGE,
  expectGate,
  repositoryEditItem,
  seedGroup,
  seedRepositoryChangedThroughGroup,
} from "../../../helpers/groups";
import { uniqueName } from "../../../helpers/unique";
import { BatchAddModal } from "../../../pom/BatchAddModal";
import { GroupDetailPage } from "../../../pom/GroupDetailPage";
import { UserDetailPage } from "../../../pom/UserDetailPage";

test.describe("Groups", () => {
  // Most tests seed through the API and log a second user in: triple the timeout.
  test.slow();

  // --- Detail page --------------------------------------------------------

  test("GRP-DET-01 header, actions menu and tabs", async ({
    api,
    cleanup,
    page,
  }) => {
    const group = await seedGroup(api, cleanup);
    const detail = await GroupDetailPage.open(page, group);
    await expect(detail.usersTab).toHaveText("Users (0)");
    await expect(detail.usersTab).toHaveAttribute("aria-selected", "true");
    await expect(detail.rolesTab).toHaveText("Roles (0)");
    await detail.actionsMenuItem("Edit Group");
    await expect(page.getByRole("menuitem")).toHaveText([
      "Edit Group",
      "Delete Group",
    ]);
  });

  test.describe("tab counts", () => {
    // Seeding 12 users and 12 roles takes a while on a busy backend.
    test.describe.configure({ timeout: 120_000 });
    const POOL = 12;
    const pool = { users: [] as string[], roles: [] as string[] };

    test.beforeAll(async ({ api }) => {
      const base = uniqueName("pool");
      pool.users = Array.from({ length: POOL }, (_, i) => `${base}-user-${i}`);
      pool.roles = Array.from({ length: POOL }, (_, i) => `${base}-role-${i}`);
      await Promise.all([
        ...pool.users.map((username) => api.createUser({ username })),
        ...pool.roles.map((name) => api.createRole({ name })),
      ]);
    });

    test.afterAll(async ({ api }) => {
      await Promise.all([
        ...pool.users.map((username) => api.deleteUser(username)),
        ...pool.roles.map((role) => api.deleteRole(role)),
      ]);
    });

    test("GRP-DET-02 user and role assignment counts", async ({
      api,
      cleanup,
      page,
    }) => {
      test.slow();
      // Main cases (each count value once; 12 is above a page, proving totals).
      for (const [u, r] of [
        [0, 0],
        [1, 12],
        [12, 1],
      ]) {
        await test.step(`${u} users and ${r} role assignments`, async () => {
          const group = await seedGroup(api, cleanup);
          await Promise.all([
            ...pool.users
              .slice(0, u)
              .map((username) => api.addGroupMember(group.name, username)),
            ...pool.roles
              .slice(0, r)
              .map((role) => api.assignRole({ group: group.name }, { role })),
          ]);
          const detail = await GroupDetailPage.open(page, group);
          await expect(detail.usersTab).toHaveText(`Users (${u})`);
          await expect(detail.rolesTab).toHaveText(`Roles (${r})`);
        });
      }
    });
  });

  // Main cases (add +1/+2 and remove −1, across the two tabs).
  const countRows = [
    { action: "add two users", tab: "users", change: 2 },
    { action: "remove one user", tab: "users", change: -1 },
    { action: "add one role", tab: "roles", change: 1 },
  ] as const;

  test("GRP-DET-03 tab counts change without a reload", async ({
    api,
    cleanup,
    page,
  }) => {
    test.slow();
    for (const row of countRows) {
      await test.step(`${row.action} changes the ${row.tab} count by ${row.change} without a reload`, async () => {
        const group = await seedGroup(api, cleanup);
        const names: string[] = [];
        for (let i = 0; i < 2; i++) {
          if (row.tab === "users") {
            const username = cleanup.user(uniqueName("user"));
            await api.createUser({ username });
            names.push(username);
          } else {
            const role = cleanup.role(uniqueName("role"));
            await api.createRole({ name: role });
            names.push(role);
          }
        }
        if (row.change < 0) {
          if (row.tab === "users")
            await api.addGroupMember(group.name, names[0]);
          else await api.assignRole({ group: group.name }, { role: names[0] });
        }
        const before = row.change < 0 ? 1 : 0;
        const detail = await GroupDetailPage.open(page, group);
        const tab = row.tab === "users" ? detail.usersTab : detail.rolesTab;
        const label = row.tab === "users" ? "Users" : "Roles";
        await expect(tab).toHaveText(`${label} (${before})`);
        await tab.click();

        if (row.change < 0) {
          if (row.tab === "users") await detail.removeUser(names[0]);
          else await detail.removeRole(names[0]);
        } else {
          await page
            .getByRole("button", {
              name: row.tab === "users" ? "Add User" : "Add Role",
              exact: true,
            })
            .click();
          const modal = new BatchAddModal(
            page,
            row.tab === "users"
              ? { title: "Add User to Group", grid: "Select users" }
              : { title: "Add Role to Group", grid: "Select roles" },
          );
          for (const name of names.slice(0, row.change))
            await modal.select(row.tab === "users" ? "Username" : "Role", name);
          await modal.addButton().click();
          await expect(modal.dialog).toBeHidden();
        }
        await expect(tab).toHaveText(`${label} (${before + row.change})`);
      });
    }
  });

  // --- Users tab ----------------------------------------------------------

  test("GRP-USR-01 the Users tab only pages, and usernames link to the user", async ({
    api,
    cleanup,
    page,
  }) => {
    const group = await seedGroup(api, cleanup);
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    await api.addGroupMember(group.name, username);
    const detail = await GroupDetailPage.open(page, group);
    await expect(detail.users.row(username)).toBeVisible();
    await expect(
      page.getByRole("tabpanel").getByPlaceholder(/^Filter by/),
    ).toHaveCount(0);
    await expect(
      detail.users.grid.getByRole("columnheader").getByRole("button"),
    ).toHaveCount(0);
    await expect(detail.users.paginator("top").nav).toBeVisible();
    await expect(detail.users.paginator("bottom").nav).toBeVisible();
    await detail.users
      .row(username)
      .getByRole("link", { name: username })
      .click();
    await expect(new UserDetailPage(page, username).title).toBeVisible();
  });

  // Main cases (both names, and neither).
  const nameCells = [
    { first: "Ada", last: "Lovelace", cell: "Ada Lovelace" },
    { first: "", last: "", cell: "—" },
  ];

  test("GRP-USR-02 Add User Name cell rendering", async ({
    api,
    cleanup,
    page,
  }) => {
    for (const row of nameCells) {
      await test.step(`first "${row.first}" and last "${row.last}" is ${row.cell}`, async () => {
        const group = await seedGroup(api, cleanup);
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({
          username,
          first_name: row.first,
          last_name: row.last,
        });
        const detail = await GroupDetailPage.open(page, group);
        await detail.addUserButton().click();
        const modal = new BatchAddModal(page, {
          title: "Add User to Group",
          grid: "Select users",
        });
        await modal.table.filter("Username", username);
        await expect(modal.table.rows).toHaveCount(1);
        expect(await modal.table.columnTexts("Name")).toEqual([row.cell]);
        // The user has no email.
        expect(await modal.table.columnTexts("Email")).toEqual(["—"]);
      });
    }
  });

  test("GRP-USR-03 added users are listed in the Users tab", async ({
    api,
    cleanup,
    page,
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
    for (const username of usernames)
      await expect(detail.users.row(username)).toBeVisible();
    await expect
      .poll(() => api.groupMemberNames(group.name))
      .toEqual([...usernames].sort());
  });

  test("GRP-USR-04 a removed user is no longer listed", async ({
    api,
    cleanup,
    page,
  }) => {
    const group = await seedGroup(api, cleanup);
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    await api.addGroupMember(group.name, username);
    const detail = await GroupDetailPage.open(page, group);
    await detail.removeUser(username);
    await expect.poll(() => api.groupMemberNames(group.name)).toEqual([]);
  });

  // GRP-USR-05: user↔group cross-page sync is covered once from the user side in
  // user-details.spec.ts (USR-GRP-05); not retested from the group side here.

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
});
