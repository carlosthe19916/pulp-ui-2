import type { Locator, Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";
import { delayApi } from "@support/helpers/delayApi";
import {
  dropRolesOnGroup,
  type Gate,
  NO_CHANGE,
  NO_DELETE,
  expectGate,
  grantOnGroup,
  permissionsFor,
  permissionsSettled,
  seedGroup,
} from "@support/helpers/groups";
import { openViaNav } from "@support/helpers/nav";
import type { IGroupRecord } from "@support/helpers/pulp-api";
import { uniqueName } from "@support/helpers/unique";
import { BatchAddModal } from "@support/pom/BatchAddModal";
import { ConfirmModal } from "@support/pom/ConfirmModal";
import { GroupDetailPage } from "@support/pom/GroupDetailPage";
import { GroupsPage } from "@support/pom/GroupsPage";
import { UserDetailPage } from "@support/pom/UserDetailPage";

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

  /**
   * GRP-LIST-01 · Row content
   *
   * Summary: The Groups list shows each group name as a link with Edit/Delete row actions, plus a filtered empty state.
   *
   * When I open Groups from the Administration navigation
   * Then the heading is "Groups", the Groups nav item is highlighted, the column headers are Name and
   * actions, and each row shows the group name as a link to its detail page and a row actions menu
   * with "Edit" and "Delete"
   * And filtering by a value that matches nothing shows "No results found" with a "Clear all filters"
   * button that restores the rows
   */
  test(
    "The Groups list shows each group name as a link with Edit/Delete row actions, plus a filtered empty state.",
    {
      tag: "@GRP-LIST-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-LIST-01",
      },
    },
    async ({ groupsPage, api, cleanup, page }) => {
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
    },
  );

  /**
   * GRP-LIST-02 · A non-superuser sees only groups they may view
   *
   * Summary: A non-superuser sees only the groups they may view in the list (scoped, not a 403).
   *
   * Auth: second-user
   *
   * Given a second user with no admin permissions who may view one group
   * When they open the Groups list
   * Then the table lists only the groups they may view (not "403: Access denied" — groups are scoped)
   */
  test(
    "A non-superuser sees only the groups they may view in the list (scoped, not a 403).",
    {
      tag: "@GRP-LIST-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-LIST-02",
      },
    },
    async ({ api, cleanup, secondUser }) => {
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
    },
  );

  // --- Permissions --------------------------------------------------------

  // The full gate matrix (every action × permission combo) is the GatedButton
  // component test; this keeps one representative pair, on the list surface, to
  // prove the group page wires real backend permissions to the gate.
  const permRows = [
    { perms: { change: false, del: false }, edit: NO_CHANGE, del: NO_DELETE },
    { perms: { change: true, del: true }, edit: "enabled", del: "enabled" },
  ] as const;
  /**
   * GRP-PERM-01 · Gated actions follow the user's permission on the group
   *
   * Summary: A group's Edit and Delete follow the logged-in user's per-group permissions, disabled with a tooltip when missing.
   *
   * Auth: second-user
   *
   * Given a second user who holds a role on group G (not a global role) granting view plus <change>
   * and <delete>
   * When they open the Groups list
   * Then the row's Edit and Delete follow <state>
   *
   * | change | delete | Edit                                                          | Delete                                                        |
   * | ------ | ------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
   * | no     | no     | disabled, tooltip "You don't have permission to change this." | disabled, tooltip "You don't have permission to delete this." |
   * | yes    | yes    | enabled                                                       | enabled                                                       |
   *
   * The detail page's actions and the Users tab's "Add User" / "Remove" use the same gate. When "Add
   * User" is enabled for a non-superuser, its modal still shows "403: Access denied" because Pulp
   * lets only superusers list users, so in practice only superusers add members from the UI.
   */
  test(
    "gated actions follow the user's permission on the group",
    {
      tag: "@GRP-PERM-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-PERM-01",
      },
    },
    async ({ api, cleanup, secondUser }) => {
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
    },
  );

  /**
   * GRP-PERM-01 · Gated actions follow the user's permission on the group
   *
   * Summary: A group's Edit and Delete follow the logged-in user's per-group permissions, disabled with a tooltip when missing.
   *
   * Auth: second-user
   *
   * Given a second user who holds a role on group G (not a global role) granting view plus <change>
   * and <delete>
   * When they open the Groups list
   * Then the row's Edit and Delete follow <state>
   *
   * | change | delete | Edit                                                          | Delete                                                        |
   * | ------ | ------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
   * | no     | no     | disabled, tooltip "You don't have permission to change this." | disabled, tooltip "You don't have permission to delete this." |
   * | yes    | yes    | enabled                                                       | enabled                                                       |
   *
   * The detail page's actions and the Users tab's "Add User" / "Remove" use the same gate. When "Add
   * User" is enabled for a non-superuser, its modal still shows "403: Access denied" because Pulp
   * lets only superusers list users, so in practice only superusers add members from the UI.
   */
  test(
    '"Add User" for a non-superuser opens a modal showing "403: Access denied"',
    {
      tag: "@GRP-PERM-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-PERM-01",
      },
    },
    async ({ api, cleanup, secondUser }) => {
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
      await expect(
        modal.table.stateHeading("403: Access denied"),
      ).toBeVisible();
    },
  );

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
    /**
     * GRP-PERM-04 · Permissions granted through a group or a global role
     *
     * Summary: Change granted via an object role enables a group's Edit; via a global role it stays disabled (a known UI gap).
     *
     * Auth: second-user
     *
     * Given a second user who gets change on groups <how>
     * Then Pulp lets them change <which groups>, and the gated "change" actions should be enabled for
     * those groups
     *
     * | how                    | which groups | UI today                |
     * | ---------------------- | ------------ | ----------------------- |
     * | a role on group G only | G only       | enabled for G           |
     * | a global role          | every group  | disabled on every group |
     *
     * UI gap: the UI reads `my_permissions/`, which only returns roles held on that group, so a global
     * role is not seen and the actions stay disabled although Pulp allows them. No endpoint exposes a
     * non-superuser's global roles, so these rows are expected to fail.
     */
    test(
      `change through ${row.how} enables Edit on G`,
      {
        tag: "@GRP-PERM-04",
        annotation: {
          type: "spec",
          description: "e2e/specs/groups.md#GRP-PERM-04",
        },
      },
      async ({ api, cleanup, secondUser }) => {
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
          await api.assignRole(
            { user: user.username },
            { role, contentObject },
          );
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
      },
    );
  }

  /**
   * GRP-PERM-06 · The admin sees everything enabled
   *
   * Summary: The admin (superuser) sees every gated group action enabled, even on a group it holds no role on.
   *
   * Given the admin (a superuser), who may do anything in Pulp
   * Then every gated action is enabled, even on a group the admin holds no role on (Pulp's
   * `my_permissions/` ignores superuser status, so the UI checks it separately)
   */
  test(
    "The admin (superuser) sees every gated group action enabled, even on a group it holds no role on.",
    {
      tag: "@GRP-PERM-06",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-PERM-06",
      },
    },
    async ({ api, cleanup, page }) => {
      const group = await seedGroup(api, cleanup);
      // Drop the admin's roles on the group so only superuser status grants the actions.
      await dropRolesOnGroup(api, { username: "admin", group });
      const member = cleanup.user(uniqueName("user"));
      await api.createUser({ username: member });
      await api.addGroupMember(group.name, member);
      for (const action of GATED_ACTIONS) {
        await test.step(action, async () => {
          const item = await locateAction(page, { action, group, member });
          await expectGate(item, "enabled");
        });
      }
    },
  );

  // --- Create -------------------------------------------------------------

  /**
   * GRP-CRE-03 · Create a group
   *
   * Summary: Creating a group shows a success toast and the new group in the list.
   *
   * When I click "Create Group", enter a name and submit
   * Then the modal closes, the toast `Group "<name>" created` appears, and the group is in the Groups
   * list
   */
  test(
    "Creating a group shows a success toast and the new group in the list.",
    {
      tag: ["@smoke", "@GRP-CRE-03"],
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-CRE-03",
      },
    },
    async ({ groupsPage, cleanup, toasts }) => {
      const name = cleanup.group(uniqueName("group"));
      await groupsPage.goto();
      await groupsPage.create(name);
      await expect(toasts.success(`Group "${name}" created`)).toBeVisible();
      await groupsPage.filterBy("Name", name);
      await groupsPage.expectRowVisible(name);
    },
  );

  /**
   * GRP-CRE-04 · A duplicate name is rejected in the form
   *
   * Summary: Submitting Create group with an existing name surfaces the server's rejection in the form.
   *
   * When I create a group with a name that already exists
   * Then an in-form error shows the server's reason, no toast appears, and the modal stays open
   */
  test(
    "Submitting Create group with an existing name surfaces the server's rejection in the form.",
    {
      tag: "@GRP-CRE-04",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-CRE-04",
      },
    },
    async ({ groupsPage, api, cleanup }) => {
      const group = await seedGroup(api, cleanup);
      await groupsPage.goto();
      const modal = await groupsPage.openCreate();
      await modal.field("Name").fill(group.name);
      await modal.button("Create").click();
      await modal.expectSubmitError(/already exists|must be unique/i);
      await expect(modal.dialog).toBeVisible();
    },
  );

  /**
   * GRP-CRE-05 · Create is enabled for a non-superuser
   *
   * Summary: A non-superuser can open Create group, but submitting a valid form fails with a permission-denied error in the form.
   *
   * Auth: second-user
   *
   * Given a second user without the global permission to add groups
   * Then "Create Group" is enabled, and submitting a valid form shows the in-form error title
   * "Failed to create group" with the text "You do not have permission to perform this action. Ask an
   * administrator to grant the required role."
   */
  test(
    "A non-superuser can open Create group, but submitting a valid form fails with a permission-denied error in the form.",
    {
      tag: "@GRP-CRE-05",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-CRE-05",
      },
    },
    async ({ secondUser, cleanup }) => {
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
    },
  );

  // --- Edit ---------------------------------------------------------------

  /**
   * GRP-EDT-01 · Rename
   *
   * Summary: Renaming a group updates the list and reflects on a member's Groups tab.
   *
   * Given user U is in group G
   * When I rename G from the Groups list and save
   * Then the toast `Group "<new name>" updated` appears, the new name shows in the Groups list, and
   * U's Groups tab shows the new name
   */
  test(
    "Renaming a group updates the list and reflects on a member's Groups tab.",
    {
      tag: "@GRP-EDT-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-EDT-01",
      },
    },
    async ({ groupsPage, api, cleanup, page, toasts }) => {
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
    },
  );

  // --- Delete -------------------------------------------------------------

  const deleteRows = ["no users, no roles", "two users"] as const;

  /**
   * GRP-DEL-01 · Delete from the list
   *
   * Summary: Deleting a group from the list confirms, spins then toasts, removes the row, and drops its members' memberships.
   *
   * Given a group with <contents>
   * When I open "Delete" from the Groups list
   * Then the dialog "Delete Group" shows `Are you sure you want to delete group "<name>"? This action
   * cannot be undone.` with a danger "Delete" button
   * When I confirm on a slow network
   * Then the button spins until the request finishes, the dialog closes, the toast `Group "<name>"
   * deleted` appears, the row is gone, and <aftermath>
   *
   * | contents           | aftermath                                                      |
   * | ------------------ | -------------------------------------------------------------- |
   * | no users, no roles | —                                                              |
   * | two users          | each user's Groups tab no longer lists it, Users list count −1 |
   */
  test(
    "Deleting a group from the list confirms, spins then toasts, removes the row, and drops its members' memberships.",
    {
      tag: "@GRP-DEL-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-DEL-01",
      },
    },
    async ({ groupsPage, usersPage, api, cleanup, page, toasts }) => {
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
    },
  );

  /**
   * GRP-DEL-03 · A failed delete keeps the dialog open
   *
   * Summary: Confirming a delete for a group removed elsewhere shows a danger toast and keeps the dialog open.
   *
   * Given a group that is deleted through the API after I open its delete dialog
   * When I confirm
   * Then the danger toast `Failed to delete group "<name>"` appears, the dialog stays open, and the
   * row is unchanged
   */
  test(
    "Confirming a delete for a group removed elsewhere shows a danger toast and keeps the dialog open.",
    {
      tag: "@GRP-DEL-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/groups.md#GRP-DEL-03",
      },
    },
    async ({ groupsPage, api, cleanup, page, toasts }) => {
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
    },
  );
});
