import type { Locator, Page } from "@playwright/test";

import { expect, test } from "../../../fixtures";
import type { Cleanup } from "../../../helpers/cleanup";
import { delayApi } from "../../../helpers/delayApi";
import {
  type Gate,
  NO_CHANGE,
  NO_DELETE,
  expectGate,
  grantOnGroup,
  navigateInApp,
  permissionsFor,
  permissionsSettled,
  repositoryEditItem,
  seedGroup,
  seedRepositoryChangedThroughGroup,
} from "../../../helpers/groups";
import { recordApiNotFound } from "../../../helpers/notFound";
import type { IGroupRecord, PulpApi } from "../../../helpers/pulp-api";
import { uniqueName } from "../../../helpers/unique";
import { BatchAddModal } from "../../../pom/BatchAddModal";
import { GroupDetailPage } from "../../../pom/GroupDetailPage";
import { GroupsPage } from "../../../pom/GroupsPage";
import { UserDetailPage } from "../../../pom/UserDetailPage";

type GatedAction =
  | 'Groups list › row "Edit"'
  | 'Groups list › row "Delete"'
  | 'detail › actions › "Edit Group"'
  | 'detail › actions › "Delete Group"'
  | 'detail › Users › "Add User"'
  | 'detail › Users › row "Remove"';

const GATED_ACTIONS: GatedAction[] = [
  'Groups list › row "Edit"',
  'Groups list › row "Delete"',
  'detail › actions › "Edit Group"',
  'detail › actions › "Delete Group"',
  'detail › Users › "Add User"',
  'detail › Users › row "Remove"',
];

/** Navigate `page` to a gated action of `group` and return it (not clicked). */
async function locateAction(
  page: Page,
  {
    action,
    group,
    member,
    awaitPermissions = true,
  }: {
    action: GatedAction;
    group: IGroupRecord;
    member: string;
    awaitPermissions?: boolean;
  },
): Promise<Locator> {
  const settled = awaitPermissions ? permissionsSettled(page) : undefined;
  const item = await openAction(page, { action, group, member });
  await settled?.();
  return item;
}

async function openAction(
  page: Page,
  {
    action,
    group,
    member,
  }: { action: GatedAction; group: IGroupRecord; member: string },
): Promise<Locator> {
  if (action.startsWith("Groups list")) {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();
    await groupsPage.filterBy("Name", group.name);
    return groupsPage.rowMenuItem(
      group.name,
      action.endsWith('"Edit"') ? "Edit" : "Delete",
    );
  }
  const detail = await GroupDetailPage.open(page, group);
  if (action.endsWith('"Edit Group"'))
    return detail.actionsMenuItem("Edit Group");
  if (action.endsWith('"Delete Group"'))
    return detail.actionsMenuItem("Delete Group");
  if (action.endsWith('"Add User"')) return detail.addUserButton();
  await expect(detail.users.row(member)).toBeVisible();
  return detail.userRemoveItem(member);
}

/** Watch for create/update requests to the groups endpoint. */
function recordGroupWrites(page: Page): string[] {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (
      ["POST", "PATCH", "PUT"].includes(request.method()) &&
      request.url().includes("/groups/")
    ) {
      writes.push(request.url());
    }
  });
  return writes;
}

test.describe("Groups", () => {
  // Most tests seed through the API and log a second user in: triple the timeout.
  test.slow();

  // --- List ---------------------------------------------------------------

  test("GRP-LIST-01 row shows the name link and Edit / Delete actions", async ({
    groupsPage,
    api,
    cleanup,
    page,
  }) => {
    const group = await seedGroup(api, cleanup);
    await groupsPage.goto();
    await groupsPage.filterBy("Name", group.name);
    await expect(
      groupsPage
        .row(group.name)
        .getByRole("link", { name: group.name, exact: true }),
    ).toBeVisible();
    await groupsPage
      .row(group.name)
      .getByRole("button", { name: "Kebab toggle" })
      .click();
    await expect(page.getByRole("menuitem")).toHaveText(["Edit", "Delete"]);
  });

  // --- Permissions --------------------------------------------------------

  for (const change of [true, false]) {
    for (const del of [true, false]) {
      // One second-user login per (change, delete) combo; each gated action is a
      // read-only step (logging a second user in is the expensive part).
      test(`GRP-PERM-01 change ${change ? "yes" : "no"}, delete ${del ? "yes" : "no"}: gated actions`, async ({
        api,
        cleanup,
        secondUser,
      }) => {
        const user = await secondUser.create();
        const group = await seedGroup(api, cleanup);
        await grantOnGroup(api, cleanup, {
          username: user.username,
          group,
          permissions: permissionsFor({ change, del }),
        });
        // The second user is the member the Remove row acts on.
        await api.addGroupMember(group.name, user.username);
        const page = await secondUser.login(user);
        for (const action of GATED_ACTIONS) {
          const needs = action.includes("Delete") ? "delete" : "change";
          const allowed = needs === "delete" ? del : change;
          const gate: Gate = allowed
            ? "enabled"
            : { tooltip: needs === "delete" ? NO_DELETE : NO_CHANGE };
          await test.step(`${action} is ${allowed ? "enabled" : "disabled"}`, async () => {
            const item = await locateAction(page, {
              action,
              group,
              member: user.username,
            });
            await expectGate(item, gate);
          });
        }
      });
    }
  }

  test('GRP-PERM-01 "Add User" for a non-superuser opens a modal showing "403: Access denied"', async ({
    api,
    cleanup,
    secondUser,
  }) => {
    const user = await secondUser.create();
    const group = await seedGroup(api, cleanup);
    await grantOnGroup(api, cleanup, {
      username: user.username,
      group,
      permissions: permissionsFor({ change: true, del: false }),
    });
    const page = await secondUser.login(user);
    const detail = await GroupDetailPage.open(page, group);
    await detail.addUserButton().click();
    const modal = new BatchAddModal(page, {
      title: "Add User to Group",
      grid: "Select users",
    });
    await expect(modal.table.stateHeading("403: Access denied")).toBeVisible();
  });

  test("GRP-PERM-02 disabled actions open nothing", async ({
    api,
    cleanup,
    secondUser,
  }) => {
    const user = await secondUser.create();
    const group = await seedGroup(api, cleanup);
    await grantOnGroup(api, cleanup, {
      username: user.username,
      group,
      permissions: permissionsFor({ change: false, del: false }),
    });
    await api.addGroupMember(group.name, user.username);
    const page = await secondUser.login(user);
    for (const action of GATED_ACTIONS) {
      await test.step(action, async () => {
        const item = await locateAction(page, {
          action,
          group,
          member: user.username,
        });
        await expect(item).toHaveAttribute("aria-disabled", "true");
        // force: Playwright won't click an aria-disabled element otherwise; the
        // point is that the click does nothing.
        await item.click({ force: true });
        await expect(page.getByRole("dialog")).toHaveCount(0);
      });
    }
  });

  test("GRP-PERM-03 permissions are per group, on the same page", async ({
    api,
    cleanup,
    secondUser,
  }) => {
    const user = await secondUser.create();
    const base = uniqueName("perm");
    const g1 = await api.createGroup(cleanup.group(`${base}-1`));
    const g2 = await api.createGroup(cleanup.group(`${base}-2`));
    await grantOnGroup(api, cleanup, {
      username: user.username,
      group: g1,
      permissions: permissionsFor({ change: true, del: true }),
    });
    await grantOnGroup(api, cleanup, {
      username: user.username,
      group: g2,
      permissions: permissionsFor({ change: false, del: false }),
    });
    const page = await secondUser.login(user);
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();
    await groupsPage.filterBy("Name", base);
    await expect(groupsPage.list.rows).toHaveCount(2);
    await expectGate(await groupsPage.rowMenuItem(g1.name, "Edit"), "enabled");
    await expectGate(
      page.getByRole("menuitem", { name: "Delete", exact: true }),
      "enabled",
    );
    await page.keyboard.press("Escape");
    await expectGate(await groupsPage.rowMenuItem(g2.name, "Edit"), {
      tooltip: NO_CHANGE,
    });
    await expectGate(
      page.getByRole("menuitem", { name: "Delete", exact: true }),
      { tooltip: NO_DELETE },
    );
  });

  const perm04 = [
    {
      how: "a role on group G only",
      via: "user",
      scope: "object",
      today: "enabled",
    },
    {
      how: "a role given to a group they belong to, on G only",
      via: "group",
      scope: "object",
      today: "enabled",
    },
    { how: "a global role", via: "user", scope: "global", today: "disabled" },
    {
      how: "a global role given to a group they belong to",
      via: "group",
      scope: "global",
      today: "disabled",
    },
  ] as const;

  for (const row of perm04) {
    test(`GRP-PERM-04 change through ${row.how} enables Edit on G`, async ({
      api,
      cleanup,
      secondUser,
    }) => {
      test.fail(
        row.today === "disabled",
        "UI gap: my_permissions/ omits global roles and no endpoint exposes a non-superuser's global roles",
      );
      const user = await secondUser.create();
      const group = await seedGroup(api, cleanup);
      const role = cleanup.role(uniqueName("role"));
      await api.createRole({
        name: role,
        permissions: permissionsFor({ change: true, del: false }),
      });
      const contentObject = row.scope === "object" ? group.pulp_href : null;
      if (row.via === "user") {
        await api.assignRole({ user: user.username }, { role, contentObject });
      } else {
        const holder = await seedGroup(api, cleanup, "holder");
        await api.addGroupMember(holder.name, user.username);
        await api.assignRole({ group: holder.name }, { role, contentObject });
      }
      const page = await secondUser.login(user);
      const item = await locateAction(page, {
        action: 'Groups list › row "Edit"',
        group,
        member: user.username,
      });
      await expectGate(item, "enabled");
    });
  }

  test("GRP-PERM-05 nothing is disabled while permissions load", async ({
    api,
    cleanup,
    secondUser,
  }) => {
    // One second-user login; each step seeds its own group and grants it to the
    // same user, so the steps are order-independent.
    const user = await secondUser.create();
    const page = await secondUser.login(user);
    for (const where of ["Groups list", "group detail"] as const) {
      await test.step(where, async () => {
        const group = await seedGroup(api, cleanup);
        await grantOnGroup(api, cleanup, {
          username: user.username,
          group,
          permissions: permissionsFor({ change: false, del: false }),
        });
        const held = await delayApi(page, { url: /my_permissions\// });
        const item = await locateAction(page, {
          action:
            where === "Groups list"
              ? 'Groups list › row "Edit"'
              : 'detail › actions › "Edit Group"',
          group,
          member: user.username,
          awaitPermissions: false,
        });
        await expect(item).toBeVisible();
        await expect(item).not.toHaveAttribute("aria-disabled", "true");
        held.release();
        // Both the released my_permissions/ and the superuser probe must answer.
        await expect(item).toHaveAttribute("aria-disabled", "true", {
          timeout: 15_000,
        });
      });
    }
  });

  for (const creator of ["the admin", "someone else"] as const) {
    test(`GRP-PERM-06 the admin sees gated actions enabled on a group created by ${creator}`, async ({
      api,
      cleanup,
      page,
    }) => {
      const group = await seedGroup(api, cleanup);
      if (creator === "someone else") {
        // The creator becomes the group's owner; drop the admin's roles on it so
        // only superuser status grants the actions.
        for (const assignment of await api.roleAssignments({
          user: "admin",
        })) {
          if (assignment.content_object === group.pulp_href)
            await api.removeRoleAssignment(assignment.pulp_href);
        }
      }
      const member = cleanup.user(uniqueName("user"));
      await api.createUser({ username: member });
      await api.addGroupMember(group.name, member);
      for (const action of GATED_ACTIONS) {
        await test.step(action, async () => {
          const item = await locateAction(page, { action, group, member });
          await expectGate(item, "enabled");
        });
      }
    });
  }

  test('GRP-PERM-07 "Create Group" is enabled and submitting shows the permission error', async ({
    secondUser,
    cleanup,
  }) => {
    const user = await secondUser.create();
    const page = await secondUser.login(user);
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();
    const modal = await groupsPage.openCreate();
    await modal.field("Name").fill(cleanup.group(uniqueName("group")));
    await modal.button("Create").click();
    await modal.expectSubmitError(
      "You do not have permission to perform this action.",
    );
    await expect(modal.dialog).toContainText("Failed to create group");
  });

  // --- Create -------------------------------------------------------------

  // GRP-CRE-01 (form fields) and the client "required" validation are component
  // tests: client/src/app/components/GroupModal/GroupModal.test.tsx.

  interface ICreateNameRow {
    name: string;
    /** Builds the typed value; may seed an existing group first. */
    input: (ctx: { api: PulpApi; cleanup: Cleanup }) => Promise<string>;
    /** The name Pulp stores, or the error that shows. */
    outcome:
      | { created: (input: string) => string }
      | { fieldError: string }
      | { serverError: string };
  }

  // Client "required" validation is a component test; these are the main
  // real-backend outcomes: created, trimmed, accepted characters, and the
  // server's own rejections.
  const createNames: ICreateNameRow[] = [
    {
      name: "a new simple name",
      input: async () => uniqueName("group"),
      outcome: { created: (input) => input },
    },
    {
      name: "with spaces around it",
      input: async () => `  ${uniqueName("group")}  `,
      outcome: { created: (input) => input.trim() },
    },
    {
      name: "with symbols, spaces and unicode",
      input: async () => `${uniqueName("group")} ops-team_2.0 日本`,
      outcome: { created: (input) => input },
    },
    // Server rejections (blank, unique, length) are contract tests:
    // tests/admin/groups/groups.api.spec.ts.
  ];

  test("GRP-CRE-02 create with various names", async ({
    groupsPage,
    api,
    cleanup,
    page,
    toasts,
  }) => {
    for (const row of createNames) {
      await test.step(`name ${row.name}`, async () => {
        const input = await row.input({ api, cleanup });
        await groupsPage.goto();
        const writes = recordGroupWrites(page);
        const modal = await groupsPage.openCreate();
        if (input) await modal.field("Name").fill(input);
        if ("created" in row.outcome) {
          const created = cleanup.group(row.outcome.created(input));
          await modal.button("Create").click();
          await modal.expectClosed();
          await expect(
            toasts.success(`Group "${created}" created`),
          ).toBeVisible();
          await expect
            .poll(async () => (await api.group(created))?.name)
            .toBe(created);
        } else if ("fieldError" in row.outcome) {
          await modal.button("Create").click();
          await expect(
            modal.dialog.getByText(row.outcome.fieldError),
          ).toBeVisible();
          expect(writes).toEqual([]);
        } else {
          cleanup.group(input.trim());
          await modal.button("Create").click();
          await modal.expectSubmitError(row.outcome.serverError);
          await expect(modal.dialog).toBeVisible();
        }
      });
    }
  });

  test(
    "GRP-CRE-03 the new group appears with a toast",
    { tag: "@smoke" },
    async ({ groupsPage, cleanup, toasts }) => {
      const name = cleanup.group(uniqueName("group"));
      await groupsPage.goto();
      await groupsPage.create(name);
      await expect(toasts.success(`Group "${name}" created`)).toBeVisible();
      await groupsPage.filterBy("Name", name);
      await groupsPage.expectRowVisible(name);
    },
  );

  // --- Edit ---------------------------------------------------------------

  test("GRP-EDT-01 rename from the Groups list and from group detail", async ({
    groupsPage,
    api,
    cleanup,
    page,
    toasts,
  }) => {
    await test.step("from Groups › row › Edit shows in the Groups list", async () => {
      const group = await seedGroup(api, cleanup);
      const renamed = cleanup.group(uniqueName("renamed"));
      await groupsPage.goto();
      await groupsPage.filterBy("Name", group.name);
      await groupsPage.rename(group.name, renamed);
      await expect(toasts.success(`Group "${renamed}" updated`)).toBeVisible();
      await groupsPage.filterBy("Name", renamed);
      await groupsPage.expectRowVisible(renamed);
    });

    await test.step('from group detail › actions › "Edit Group" shows in header, breadcrumb, tab title and list', async () => {
      const group = await seedGroup(api, cleanup);
      const renamed = cleanup.group(uniqueName("renamed"));
      const detail = await GroupDetailPage.open(page, group);
      const modal = await detail.openEdit(group.name);
      await modal.field("Name").fill(renamed);
      await modal.button("Save").click();
      await modal.expectClosed();
      await expect(toasts.success(`Group "${renamed}" updated`)).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: renamed, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Breadcrumb" }),
      ).toContainText(renamed);
      await expect(page).toHaveTitle(new RegExp(`Group · ${renamed}`));
      await navigateInApp(page, "Groups");
      await groupsPage.filterBy("Name", renamed);
      await groupsPage.expectRowVisible(renamed);
    });
  });

  test("GRP-EDT-02 a rename shows on a member's Groups tab", async ({
    groupsPage,
    api,
    cleanup,
    page,
  }) => {
    const group = await seedGroup(api, cleanup);
    const renamed = cleanup.group(uniqueName("renamed"));
    const username = cleanup.user(uniqueName("user"));
    const user = await api.createUser({ username });
    await api.addGroupMember(group.name, username);
    await groupsPage.goto();
    await groupsPage.filterBy("Name", group.name);
    await groupsPage.rename(group.name, renamed);
    await page.goto(`/admin/users/${user.id}`);
    const detail = new UserDetailPage(page, username);
    await expect(
      detail.groupsTable.getByRole("link", { name: renamed, exact: true }),
    ).toBeVisible();
  });

  const editNames = [
    { name: "(empty)", target: "empty", outcome: "Name is required" },
    {
      name: "another group's name",
      target: "other",
      outcome: "This field must be unique.",
    },
    { name: "its own current name", target: "own", outcome: "updated" },
  ] as const;

  test("GRP-EDT-03 rename validation", async ({
    groupsPage,
    api,
    cleanup,
    page,
    toasts,
  }) => {
    for (const row of editNames) {
      await test.step(`rename to ${row.name}`, async () => {
        const group = await seedGroup(api, cleanup);
        const other =
          row.target === "other" ? await seedGroup(api, cleanup) : null;
        await groupsPage.goto();
        await groupsPage.filterBy("Name", group.name);
        const writes = recordGroupWrites(page);
        const modal = await groupsPage.openEdit(group.name);
        if (row.target === "empty") {
          await modal.field("Name").fill("");
          await modal.button("Save").click();
          await expect(modal.dialog.getByText(row.outcome)).toBeVisible();
          expect(writes).toEqual([]);
        } else if (other) {
          await modal.field("Name").fill(other.name);
          await modal.button("Save").click();
          await modal.expectSubmitError(row.outcome);
        } else {
          await modal.button("Save").click();
          await modal.expectClosed();
          await expect(
            toasts.success(`Group "${group.name}" updated`),
          ).toBeVisible();
        }
      });
    }
  });

  test("GRP-EDT-04 the edit form shows the current name", async ({
    groupsPage,
    api,
    cleanup,
  }) => {
    const group = await seedGroup(api, cleanup);
    await groupsPage.goto();
    await groupsPage.filterBy("Name", group.name);
    const modal = await groupsPage.openEdit(group.name);
    await expect(modal.title).toHaveText(`Edit ${group.name}`);
    await expect(modal.field("Name")).toHaveValue(group.name);
  });

  // --- Delete -------------------------------------------------------------

  const deleteRows = [
    { contents: "no users, no roles", entry: "list" },
    { contents: "no users, no roles", entry: "detail" },
    { contents: "two users", entry: "list" },
    { contents: "two users", entry: "detail" },
    { contents: "global and object roles", entry: "list" },
    { contents: "global and object roles", entry: "detail" },
  ] as const;

  test("GRP-DEL-01 delete a group from the list and the detail page", async ({
    groupsPage,
    usersPage,
    api,
    cleanup,
    page,
    toasts,
  }) => {
    // Six full delete flows, each seeding users / roles: extra headroom.
    test.slow();
    for (const row of deleteRows) {
      await test.step(`${row.contents} from the ${row.entry}`, async () => {
        const group = await seedGroup(api, cleanup);
        const members: string[] = [];
        const assignments: string[] = [];
        if (row.contents === "two users") {
          for (let i = 0; i < 2; i++) {
            const username = cleanup.user(uniqueName("user"));
            await api.createUser({ username });
            await api.addGroupMember(group.name, username);
            members.push(username);
          }
        }
        if (row.contents === "global and object roles") {
          const repo = cleanup.repository(uniqueName("repo"));
          const { pulp_href } = await api.createFileRepository(repo);
          assignments.push(
            (
              await api.assignRole(
                { group: group.name },
                { role: "core.task_viewer" },
              )
            ).pulp_href,
            (
              await api.assignRole(
                { group: group.name },
                {
                  role: "file.filerepository_viewer",
                  contentObject: pulp_href,
                },
              )
            ).pulp_href,
          );
        }

        if (row.entry === "list") {
          await groupsPage.goto();
          await groupsPage.filterBy("Name", group.name);
          await groupsPage.delete(group.name);
          await groupsPage.expectRowGone(group.name);
        } else {
          const detail = await GroupDetailPage.open(page, group);
          const notFound = recordApiNotFound(page);
          await detail.deleteGroup();
          await expect(page).toHaveURL(/\/admin\/groups$/);
          await expect(groupsPage.heading).toBeVisible();
          expect(notFound).toEqual([]);
        }
        await expect(
          toasts.success(`Group "${group.name}" deleted`),
        ).toBeVisible();
        await expect.poll(() => api.group(group.name)).toBeUndefined();

        for (const username of members) {
          await usersPage.goto();
          await usersPage.filterBy("Username", username);
          await expect(
            usersPage.row(username).getByRole("gridcell").nth(3),
          ).toHaveText("0");
          const userDetail = await usersPage.openDetail(username);
          await expect(userDetail.groupsTab).toHaveText("Groups (0)");
          await expect(
            userDetail.groupsTable.getByRole("link", { name: group.name }),
          ).toHaveCount(0);
        }
        for (const href of assignments) {
          await expect.poll(() => api.status(href)).toBe(404);
        }
      });
    }
  });

  test("GRP-DEL-02 members lose permissions that came through the group", async ({
    groupsPage,
    api,
    cleanup,
    secondUser,
  }) => {
    const user = await secondUser.create();
    const { repo, group } = await seedRepositoryChangedThroughGroup(
      api,
      cleanup,
      user.username,
    );
    await api.addGroupMember(group.name, user.username);
    const userPage = await secondUser.login(user);
    await expectGate(await repositoryEditItem(userPage, repo), "enabled");

    await groupsPage.goto();
    await groupsPage.filterBy("Name", group.name);
    await groupsPage.delete(group.name);
    await groupsPage.expectRowGone(group.name);

    await expectGate(await repositoryEditItem(userPage, repo), {
      tooltip: NO_CHANGE,
    });
  });
});
