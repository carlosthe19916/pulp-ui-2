import type { Locator, Page } from "@playwright/test";

import { expect, test } from "../../../fixtures";
import { delayApi } from "../../../helpers/delayApi";
import {
  type Gate,
  NO_CHANGE,
  NO_DELETE,
  expectGate,
  grantOnGroup,
  permissionsFor,
  permissionsSettled,
  seedGroup,
} from "../../../helpers/groups";
import type { IGroupRecord } from "../../../helpers/pulp-api";
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

  // The full gate matrix (every action × permission combo) is the GatedButton
  // component test; this keeps one representative pair, on the list surface, to
  // prove the group page wires real backend permissions to the gate.
  const permRows = [
    { perms: { change: false, del: false }, edit: NO_CHANGE, del: NO_DELETE },
    { perms: { change: true, del: true }, edit: "enabled", del: "enabled" },
  ] as const;
  test("GRP-PERM-01 gated actions follow the user's permission on the group", async ({
    api,
    cleanup,
    secondUser,
  }) => {
    const user = await secondUser.create();
    const page = await secondUser.login(user);
    for (const row of permRows) {
      await test.step(
        row.edit === "enabled" ? "change + delete" : "view only",
        async () => {
          const group = await seedGroup(api, cleanup);
          await grantOnGroup(api, cleanup, {
            username: user.username,
            group,
            permissions: permissionsFor(row.perms),
          });
          const editGate: Gate =
            row.edit === "enabled" ? "enabled" : { tooltip: row.edit };
          const deleteGate: Gate =
            row.del === "enabled" ? "enabled" : { tooltip: row.del };
          await expectGate(
            await locateAction(page, {
              action: 'Groups list › row "Edit"',
              group,
              member: user.username,
            }),
            editGate,
          );
          await expectGate(
            await locateAction(page, {
              action: 'Groups list › row "Delete"',
              group,
              member: user.username,
            }),
            deleteGate,
          );
        },
      );
    }
  });

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

  // Main cases: an object role that works today, and a global role the UI misses.
  const perm04 = [
    {
      how: "a role on group G only",
      via: "user",
      scope: "object",
      today: "enabled",
    },
    { how: "a global role", via: "user", scope: "global", today: "disabled" },
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

  test("GRP-PERM-06 the admin sees every gated action enabled, even on a group it holds no role on", async ({
    api,
    cleanup,
    page,
  }) => {
    const group = await seedGroup(api, cleanup);
    // Drop the admin's roles on the group so only superuser status grants the actions.
    for (const assignment of await api.roleAssignments({ user: "admin" })) {
      if (assignment.content_object === group.pulp_href)
        await api.removeRoleAssignment(assignment.pulp_href);
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
  // tests (GroupModal.test.tsx); GRP-CRE-02's server name rules are the api
  // contract test (groups.api.spec.ts). This is the create UI journey.

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

  // Renaming from the detail page is the same modal; its header/breadcrumb/title
  // sync is the FORM-12 cross-page check.
  test("GRP-EDT-01 rename from the Groups list", async ({
    groupsPage,
    api,
    cleanup,
    toasts,
  }) => {
    const group = await seedGroup(api, cleanup);
    const renamed = cleanup.group(uniqueName("renamed"));
    await groupsPage.goto();
    await groupsPage.filterBy("Name", group.name);
    await groupsPage.rename(group.name, renamed);
    await expect(toasts.success(`Group "${renamed}" updated`)).toBeVisible();
    await groupsPage.filterBy("Name", renamed);
    await groupsPage.expectRowVisible(renamed);
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

  // GRP-EDT-03 (rename validation) is FORM-05/FORM-09; GRP-EDT-04 (the edit form
  // shows the current name) is the GroupModal component test.

  // --- Delete -------------------------------------------------------------

  // Delete from the list (the detail dialog is the same; its extra behaviour is CONF-06).
  const deleteRows = [
    "no users, no roles",
    "two users",
    "global and object roles",
  ] as const;

  test("GRP-DEL-01 delete a group from the list", async ({
    groupsPage,
    usersPage,
    api,
    cleanup,
    toasts,
  }) => {
    test.slow();
    for (const contents of deleteRows) {
      await test.step(contents, async () => {
        const group = await seedGroup(api, cleanup);
        const members: string[] = [];
        const assignments: string[] = [];
        if (contents === "two users") {
          for (let i = 0; i < 2; i++) {
            const username = cleanup.user(uniqueName("user"));
            await api.createUser({ username });
            await api.addGroupMember(group.name, username);
            members.push(username);
          }
        }
        if (contents === "global and object roles") {
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

        await groupsPage.goto();
        await groupsPage.filterBy("Name", group.name);
        await groupsPage.delete(group.name);
        await groupsPage.expectRowGone(group.name);
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

  // GRP-DEL-02 (members lose permissions a deleted group's roles gave them) is the
  // same membership-removal mechanism as the one representative RBAC-effect e2e,
  // GRP-USR-06 in group-details.spec.ts; not tested separately.
});
