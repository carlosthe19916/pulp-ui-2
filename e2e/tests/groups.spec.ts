import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import type { Cleanup } from "./helpers/cleanup";
import { delayApi } from "./helpers/delayApi";
import { recordApiNotFound } from "./helpers/notFound";
import type { IGroupRecord, PulpApi } from "./helpers/pulp-api";
import { uniqueName } from "./helpers/unique";
import { BatchAddModal } from "./pom/BatchAddModal";
import { GroupDetailPage } from "./pom/GroupDetailPage";
import { GroupsPage } from "./pom/GroupsPage";
import { UserDetailPage } from "./pom/UserDetailPage";

// Scenarios: e2e/specs/groups.md (GRP-*).

const NO_CHANGE = "You don't have permission to change this.";
const NO_DELETE = "You don't have permission to delete this.";

type Gate = "enabled" | { tooltip: string };

/** An action is enabled, or disabled (aria-disabled, still visible) with a tooltip. */
async function expectGate(item: Locator, gate: Gate): Promise<void> {
  await expect(item).toBeVisible();
  if (gate === "enabled") {
    await expect(item).not.toHaveAttribute("aria-disabled", "true");
    return;
  }
  await expect(item).toHaveAttribute("aria-disabled", "true");
  await item.hover();
  await expect(item.page().getByRole("tooltip")).toHaveText(gate.tooltip);
}

/** Create a group through the API and register it for cleanup. */
async function seedGroup(
  api: PulpApi,
  cleanup: Cleanup,
  kind = "group",
): Promise<IGroupRecord> {
  return api.createGroup(cleanup.group(uniqueName(kind)));
}

/** Give a user a role on one group, holding exactly `permissions`. */
async function grantOnGroup(
  api: PulpApi,
  cleanup: Cleanup,
  {
    username,
    group,
    permissions,
  }: { username: string; group: IGroupRecord; permissions: string[] },
): Promise<void> {
  const role = cleanup.role(uniqueName("role"));
  await api.createRole({ name: role, permissions });
  await api.assignRole(
    { user: username },
    { role, contentObject: group.pulp_href },
  );
}

const permissionsFor = ({
  change,
  del,
}: {
  change: boolean;
  del: boolean;
}): string[] => [
  "core.view_group",
  ...(change ? ["core.change_group"] : []),
  ...(del ? ["core.delete_group"] : []),
];

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

/**
 * Resolve once the permission checks a fresh page load starts have answered and
 * rendered: `my_permissions/` and the superuser probe (`users/{id}/`). Until then
 * nothing is disabled, so asserting "enabled" earlier would pass vacuously.
 */
function permissionsSettled(page: Page): () => Promise<void> {
  const settled = Promise.all(
    [/\/my_permissions\/$/, /\/users\/\d+\/$/].map((url) =>
      page
        .waitForResponse(
          (r) =>
            r.request().method() === "GET" && url.test(r.url().split("?")[0]),
        )
        .then((r) => r.finished()),
    ),
  );
  return async () => {
    await settled;
    // Two animation frames: React has committed the re-render the answers caused.
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  };
}

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

/**
 * A file repository the second user may view directly and change only through the
 * returned group, which holds `file.filerepository_owner` on it.
 */
async function seedRepositoryChangedThroughGroup(
  api: PulpApi,
  cleanup: Cleanup,
  username: string,
): Promise<{ repo: string; group: IGroupRecord }> {
  const repo = cleanup.repository(uniqueName("repo"));
  const { pulp_href } = await api.createFileRepository(repo);
  await api.assignRole(
    { user: username },
    { role: "file.filerepository_viewer", contentObject: pulp_href },
  );
  const group = await seedGroup(api, cleanup);
  await api.assignRole(
    { group: group.name },
    { role: "file.filerepository_owner", contentObject: pulp_href },
  );
  return { repo, group };
}

/** The "Edit" row action of a repository in the Repositories list, as `page`'s user. */
async function repositoryEditItem(page: Page, repo: string): Promise<Locator> {
  const settled = permissionsSettled(page);
  await page.goto("/content-management/default/repositories");
  const grid = page.getByRole("grid", { name: "Repositories table" });
  await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "GET" && r.url().includes(repo),
    ),
    page.getByPlaceholder("Filter by Name").fill(repo),
  ]);
  await grid
    .getByRole("row")
    .filter({ hasText: repo })
    .getByRole("button", { name: "Kebab toggle" })
    .click();
  await settled();
  return page.getByRole("menuitem", { name: "Edit", exact: true });
}

/** In-app navigation (no reload), so cached pages keep their state. */
async function navigateInApp(
  page: Page,
  item: "Users" | "Groups",
): Promise<void> {
  const nav = page.getByRole("navigation", { name: "Nav" });
  await nav.getByRole("button", { name: "Administration" }).click();
  await nav.getByRole("link", { name: item, exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: item }),
  ).toBeVisible();
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
      for (const action of GATED_ACTIONS) {
        const needs = action.includes("Delete") ? "delete" : "change";
        const allowed = needs === "delete" ? del : change;
        const gate: Gate = allowed
          ? "enabled"
          : { tooltip: needs === "delete" ? NO_DELETE : NO_CHANGE };
        test(`GRP-PERM-01 change ${change ? "yes" : "no"}, delete ${del ? "yes" : "no"}: ${action} is ${allowed ? "enabled" : "disabled"}`, async ({
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
          const item = await locateAction(page, {
            action,
            group,
            member: user.username,
          });
          await expectGate(item, gate);
        });
      }
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

  for (const action of GATED_ACTIONS) {
    test(`GRP-PERM-02 disabled ${action} opens nothing`, async ({
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
      const item = await locateAction(page, {
        action,
        group,
        member: user.username,
      });
      await expect(item).toHaveAttribute("aria-disabled", "true");
      // force: Playwright won't click an aria-disabled element otherwise; the point
      // is that the click does nothing.
      await item.click({ force: true });
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });
  }

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

  for (const where of ["Groups list", "group detail"] as const) {
    test(`GRP-PERM-05 nothing is disabled while permissions load: ${where}`, async ({
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
      const page = await secondUser.login(user);
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

  for (const creator of ["the admin", "someone else"] as const) {
    for (const action of GATED_ACTIONS) {
      test(`GRP-PERM-06 the admin sees ${action} enabled on a group created by ${creator}`, async ({
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
        const item = await locateAction(page, { action, group, member });
        await expectGate(item, "enabled");
      });
    }
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

  test("GRP-CRE-01 the Create Group modal has a single required Name field", async ({
    groupsPage,
  }) => {
    await groupsPage.goto();
    const modal = await groupsPage.openCreate();
    await expect(modal.dialog.getByRole("textbox")).toHaveCount(1);
    await expect(modal.field("Name")).toBeVisible();
    await expect(modal.dialog.getByText("Name", { exact: true })).toBeVisible();
    // PatternFly marks a required label with an asterisk.
    await expect(modal.dialog.getByText("*", { exact: true })).toBeVisible();
  });

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

  const createNames: ICreateNameRow[] = [
    {
      name: "(empty)",
      input: async () => "",
      outcome: { fieldError: "Name is required" },
    },
    {
      name: "only spaces",
      input: async () => "     ",
      outcome: { serverError: "This field may not be blank." },
    },
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
      name: "an existing group's name",
      input: async ({ api, cleanup }) => (await seedGroup(api, cleanup)).name,
      outcome: { serverError: "This field must be unique." },
    },
    {
      name: "an existing name in different case",
      input: async ({ api, cleanup }) =>
        (await seedGroup(api, cleanup)).name.toUpperCase(),
      outcome: { created: (input) => input },
    },
    {
      name: "with symbols (ops-team_2.0)",
      input: async () => `${uniqueName("group")}-ops-team_2.0`,
      outcome: { created: (input) => input },
    },
    {
      name: "with spaces inside (ops team)",
      input: async () => `${uniqueName("group")} ops team`,
      outcome: { created: (input) => input },
    },
    {
      name: "unicode (équipe 日本)",
      input: async () => `${uniqueName("group")} équipe 日本`,
      outcome: { created: (input) => input },
    },
    {
      name: "exactly 150 characters",
      input: async () => uniqueName("group").padEnd(150, "x"),
      outcome: { created: (input) => input },
    },
    {
      name: "151 characters",
      input: async () => uniqueName("group").padEnd(151, "x"),
      outcome: {
        serverError: "Ensure this field has no more than 150 characters.",
      },
    },
  ];

  for (const row of createNames) {
    test(`GRP-CRE-02 name ${row.name}`, async ({
      groupsPage,
      api,
      cleanup,
      page,
      toasts,
    }) => {
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

  test("GRP-CRE-03 the new group appears with a toast", async ({
    groupsPage,
    cleanup,
    toasts,
  }) => {
    const name = cleanup.group(uniqueName("group"));
    await groupsPage.goto();
    await groupsPage.create(name);
    await expect(toasts.success(`Group "${name}" created`)).toBeVisible();
    await groupsPage.filterBy("Name", name);
    await groupsPage.expectRowVisible(name);
  });

  // --- Edit ---------------------------------------------------------------

  test("GRP-EDT-01 rename from Groups › row › Edit shows in the Groups list", async ({
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

  test('GRP-EDT-01 rename from group detail › actions › "Edit Group" shows in header, breadcrumb, tab title and list', async ({
    groupsPage,
    api,
    cleanup,
    page,
    toasts,
  }) => {
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

  for (const row of editNames) {
    test(`GRP-EDT-03 rename to ${row.name}`, async ({
      groupsPage,
      api,
      cleanup,
      page,
      toasts,
    }) => {
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

  for (const row of deleteRows) {
    test(`GRP-DEL-01 delete a group with ${row.contents} from the ${row.entry}`, async ({
      groupsPage,
      usersPage,
      api,
      cleanup,
      page,
      toasts,
    }) => {
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
              { role: "file.filerepository_viewer", contentObject: pulp_href },
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

    for (const u of [0, 1, 12]) {
      for (const r of [0, 1, 12]) {
        test(`GRP-DET-02 ${u} users and ${r} role assignments`, async ({
          api,
          cleanup,
          page,
        }) => {
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
    }
  });

  const countRows = [
    { action: "add one user", tab: "users", change: 1 },
    { action: "add two users", tab: "users", change: 2 },
    { action: "remove one user", tab: "users", change: -1 },
    { action: "add one role", tab: "roles", change: 1 },
    { action: "add two roles", tab: "roles", change: 2 },
    { action: "remove one role", tab: "roles", change: -1 },
  ] as const;

  for (const row of countRows) {
    test(`GRP-DET-03 ${row.action} changes the ${row.tab} count by ${row.change} without a reload`, async ({
      api,
      cleanup,
      page,
    }) => {
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
        if (row.tab === "users") await api.addGroupMember(group.name, names[0]);
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

  const nameCells = [
    { first: "Ada", last: "Lovelace", cell: "Ada Lovelace" },
    { first: "Ada", last: "", cell: "Ada" },
    { first: "", last: "Lovelace", cell: "Lovelace" },
    { first: "", last: "", cell: "—" },
  ];

  for (const row of nameCells) {
    test(`GRP-USR-02 Add User Name cell for first "${row.first}" and last "${row.last}" is ${row.cell}`, async ({
      api,
      cleanup,
      page,
    }) => {
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

  test("GRP-USR-05 G › Users › add user U shows on U's open detail page and in the Users list", async ({
    groupsPage,
    usersPage,
    api,
    cleanup,
    page,
  }) => {
    const group = await seedGroup(api, cleanup);
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });

    // Visit the user page first so its record (with no groups) is cached.
    await usersPage.goto();
    await usersPage.filterBy("Username", username);
    const userDetail = await usersPage.openDetail(username);
    await expect(userDetail.groupsTab).toHaveText("Groups (0)");

    await navigateInApp(page, "Groups");
    await groupsPage.filterBy("Name", group.name);
    const groupDetail = await groupsPage.openDetail(group.name);
    await groupDetail.addUser(username);

    await groupDetail.usersTable
      .getByRole("link", { name: username, exact: true })
      .click();
    await expect(userDetail.groupsTab).toHaveText("Groups (1)");
    await expect(
      userDetail.groupsTable.getByRole("link", {
        name: group.name,
        exact: true,
      }),
    ).toBeVisible();

    // The same filter was fetched before, so it may answer from the cache without a
    // request: type it and assert the (invalidated) count instead of waiting on one.
    await navigateInApp(page, "Users");
    await usersPage.list.filterInput("Username").fill(username);
    await expect(
      usersPage.row(username).getByRole("gridcell").nth(3),
    ).toHaveText("1");
  });

  test("GRP-USR-05 G › Users › remove user U shows on U's open detail page and in the Users list", async ({
    groupsPage,
    usersPage,
    api,
    cleanup,
    page,
  }) => {
    const group = await seedGroup(api, cleanup);
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    await api.addGroupMember(group.name, username);

    await usersPage.goto();
    await usersPage.filterBy("Username", username);
    await expect(
      usersPage.row(username).getByRole("gridcell").nth(3),
    ).toHaveText("1");
    const userDetail = await usersPage.openDetail(username);
    await expect(userDetail.groupsTab).toHaveText("Groups (1)");

    await navigateInApp(page, "Groups");
    await groupsPage.filterBy("Name", group.name);
    const groupDetail = await groupsPage.openDetail(group.name);
    await groupDetail.removeUser(username);

    await page.goBack();
    await page.goBack();
    await expect(userDetail.title).toBeVisible();
    await expect(userDetail.groupsTab).toHaveText("Groups (0)");
    await expect(
      userDetail.groupsTable.getByRole("link", { name: group.name }),
    ).toHaveCount(0);

    await navigateInApp(page, "Users");
    await usersPage.list.filterInput("Username").fill(username);
    await expect(
      usersPage.row(username).getByRole("gridcell").nth(3),
    ).toHaveText("0");
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
});
