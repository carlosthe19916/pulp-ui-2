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
import { openViaNav } from "../../../helpers/nav";
import type { IGroupRecord } from "../../../helpers/pulp-api";
import { uniqueName } from "../../../helpers/unique";
import { BatchAddModal } from "../../../pom/BatchAddModal";
import { ConfirmModal } from "../../../pom/ConfirmModal";
import { GroupDetailPage } from "../../../pom/GroupDetailPage";
import { GroupsPage } from "../../../pom/GroupsPage";
import { UserDetailPage } from "../../../pom/UserDetailPage";

// Scenarios: e2e/specs/groups.md (list, permissions, create, edit, delete).

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
    // Reached from the Administration nav, which highlights the Groups item.
    await openViaNav(page, "Groups");
    expect(await groupsPage.list.headerTexts()).toEqual(["Name", "Actions"]);
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
    await page.keyboard.press("Escape");
    // A no-match filter shows the empty state with "Clear all filters".
    await groupsPage.filterBy("Name", `nomatch-${uniqueName("x")}`);
    await expect(
      groupsPage.list.stateHeading("No results found"),
    ).toBeVisible();
  });

  test("GRP-LIST-02 a non-superuser sees only groups they may view", async ({
    api,
    cleanup,
    secondUser,
  }) => {
    const user = await secondUser.create();
    const viewable = await seedGroup(api, cleanup);
    const hidden = await seedGroup(api, cleanup);
    await grantOnGroup(api, cleanup, {
      username: user.username,
      group: viewable,
      permissions: permissionsFor({ change: false, del: false }),
    });
    const page = await secondUser.login(user);
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();
    // Groups are scoped, so the table lists what they may view, never "403".
    await expect(
      groupsPage.list.stateHeading("403: Access denied"),
    ).toHaveCount(0);
    await groupsPage.filterBy("Name", viewable.name);
    await expect(groupsPage.row(viewable.name)).toBeVisible();
    await groupsPage.filterBy("Name", hidden.name);
    await expect(
      groupsPage.list.stateHeading("No results found"),
    ).toBeVisible();
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

  // --- Create -------------------------------------------------------------

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

  test("GRP-CRE-04 a duplicate name is rejected in the form", async ({
    groupsPage,
    api,
    cleanup,
  }) => {
    const group = await seedGroup(api, cleanup);
    await groupsPage.goto();
    const modal = await groupsPage.openCreate();
    await modal.field("Name").fill(group.name);
    await modal.button("Create").click();
    await modal.expectSubmitError(/already exists|must be unique/i);
    await expect(modal.dialog).toBeVisible();
  });

  test("GRP-CRE-05 create is not gated for a non-superuser", async ({
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
      "You do not have permission to perform this action. Ask an administrator to grant the required role.",
    );
    await expect(modal.dialog).toContainText("Failed to create group");
  });

  // --- Edit ---------------------------------------------------------------

  test("GRP-EDT-01 rename", async ({
    groupsPage,
    api,
    cleanup,
    page,
    toasts,
  }) => {
    const group = await seedGroup(api, cleanup);
    const renamed = cleanup.group(uniqueName("renamed"));
    const username = cleanup.user(uniqueName("user"));
    const user = await api.createUser({ username });
    await api.addGroupMember(group.name, username);

    await groupsPage.goto();
    await groupsPage.filterBy("Name", group.name);
    await groupsPage.rename(group.name, renamed);
    await expect(toasts.success(`Group "${renamed}" updated`)).toBeVisible();
    await groupsPage.filterBy("Name", renamed);
    await groupsPage.expectRowVisible(renamed);

    // Cross-page sync: the member's Groups tab shows the new name.
    await page.goto(`/admin/users/${user.id}`);
    const detail = new UserDetailPage(page, username);
    await expect(
      detail.groupsTable.getByRole("link", { name: renamed, exact: true }),
    ).toBeVisible();
  });

  // --- Delete -------------------------------------------------------------

  const deleteRows = ["no users, no roles", "two users"] as const;

  test("GRP-DEL-01 delete from the list", async ({
    groupsPage,
    usersPage,
    api,
    cleanup,
    page,
    toasts,
  }) => {
    test.slow();
    for (const contents of deleteRows) {
      await test.step(contents, async () => {
        const group = await seedGroup(api, cleanup);
        const members: string[] = [];
        if (contents === "two users") {
          for (let i = 0; i < 2; i++) {
            const username = cleanup.user(uniqueName("user"));
            await api.createUser({ username });
            await api.addGroupMember(group.name, username);
            members.push(username);
          }
        }

        await groupsPage.goto();
        await groupsPage.filterBy("Name", group.name);
        await groupsPage.rowAction(group.name, "Delete");
        const dialog = new ConfirmModal(page, "Delete Group");
        await expect(dialog.dialog).toContainText(
          `Are you sure you want to delete group "${group.name}"? This action cannot be undone.`,
        );
        // Slow network: the dialog stays open until the request finishes.
        const held = await delayApi(page, {
          url: (url) => url.pathname.includes("/groups/"),
          method: "DELETE",
        });
        await dialog.button("Delete").click();
        await expect(dialog.dialog).toBeVisible();
        held.release();
        await expect(dialog.dialog).toBeHidden();
        await expect(
          toasts.success(`Group "${group.name}" deleted`),
        ).toBeVisible();
        await groupsPage.expectRowGone(group.name);
        await expect.poll(() => api.group(group.name)).toBeUndefined();

        for (const username of members) {
          await usersPage.goto();
          await usersPage.filterBy("Username", username);
          await expect(
            usersPage.row(username).getByRole("gridcell").nth(3),
          ).toHaveText("0");
          const userDetail = await usersPage.openDetail(username);
          await expect(userDetail.groupsTab).toHaveText("Groups (0)");
        }
      });
    }
  });

  test("GRP-DEL-03 a failed delete keeps the dialog open", async ({
    groupsPage,
    api,
    cleanup,
    page,
    toasts,
  }) => {
    const group = await seedGroup(api, cleanup);
    await groupsPage.goto();
    await groupsPage.filterBy("Name", group.name);
    await groupsPage.rowAction(group.name, "Delete");
    const dialog = new ConfirmModal(page, "Delete Group");
    // The group is deleted elsewhere before confirming.
    await api.deleteGroup(group.name);
    await dialog.button("Delete").click();
    await expect(
      toasts.danger(`Failed to delete group "${group.name}"`),
    ).toBeVisible();
    await expect(dialog.dialog).toBeVisible();
  });
});
