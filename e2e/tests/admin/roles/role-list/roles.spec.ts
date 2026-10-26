import type { Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";
import { openViaNav } from "@support/helpers/nav";
import type { PulpApi } from "@support/helpers/pulp-api";
import { uniqueName } from "@support/helpers/unique";
import { DataTable } from "@support/pom/DataTable";
import { PermissionTags } from "@support/pom/PermissionTags";
import {
  RoleAssignmentsTab,
  type RoleOwnerKind,
} from "@support/pom/RoleAssignmentsTab";
import { RolesPage } from "@support/pom/RolesPage";

// Scenarios: e2e/specs/roles.md (ROL-*). Assigning roles to users/groups is on
// those detail pages (users.md / groups.md Roles tab).

// Real codenames for permission edits: Pulp rejects unknown ones.
const VIEW_TASK = "core.view_task";
const CHANGE_TASK = "core.change_task";
const DELETE_TASK = "core.delete_task";

// A built-in locked role (Pulp can't create locked roles through the API).
const LOCKED_ROLE = "core.task_owner";

// Columns of a Roles list row.
const NAME = 0;
const PLUGIN = 1;
const DESCRIPTION = 2;
const PERMISSIONS = 3;
const LOCKED = 4;

/** A role name with a fixed shape around a unique part (`custom.<unique>`, …). */
const roleName = (shape: (unique: string) => string): string =>
  shape(uniqueName("role"));

const rolesCollection = (api: PulpApi): string =>
  `/api/pulp${api.domainEnabled ? "/default" : ""}/api/v3/roles/`;

interface IRoleList {
  count: number;
  results: { name: string; locked: boolean }[];
}

/** The first page Pulp returns for the same params as the UI's list. */
const apiRolesPage = (
  api: PulpApi,
  params: Record<string, string | number>,
): Promise<IRoleList> =>
  api.getJson<IRoleList>(rolesCollection(api), {
    limit: 10,
    offset: 0,
    fields: "name,locked",
    ...params,
  });

/** Find a role by exact name in the Roles list. */
const findRole = async (rolesPage: RolesPage, name: string): Promise<void> => {
  await rolesPage.goto();
  await rolesPage.filterBy("Name", name);
  await expect(rolesPage.exactRow(name)).toBeVisible();
};

const ownerDetailUrl = async (
  api: PulpApi,
  kind: RoleOwnerKind,
  name: string,
): Promise<string> => {
  if (kind === "user") {
    const user = await api.user(name);
    return `/admin/users/${user?.id}`;
  }
  const group = await api.group(name);
  return `/admin/groups/${group?.id}`;
};

/** Create an owner (user or group) through the API and register its cleanup. */
const seedOwner = async ({
  api,
  cleanup,
  kind,
}: {
  api: PulpApi;
  cleanup: { user: (n: string) => string; group: (n: string) => string };
  kind: RoleOwnerKind;
}): Promise<string> => {
  if (kind === "user") {
    const name = cleanup.user(uniqueName("user"));
    await api.createUser({ username: name });
    return name;
  }
  const name = cleanup.group(uniqueName("group"));
  await api.createGroup(name);
  return name;
};

const openRolesTab = async ({
  page,
  api,
  kind,
  owner,
}: {
  page: Page;
  api: PulpApi;
  kind: RoleOwnerKind;
  owner: string;
}): Promise<RoleAssignmentsTab> => {
  await page.goto(await ownerDetailUrl(api, kind, owner));
  await expect(
    page.getByRole("heading", { level: 1, name: owner }),
  ).toBeVisible();
  const tab = new RoleAssignmentsTab(page, kind);
  await tab.open();
  return tab;
};

const ownerRef = (kind: RoleOwnerKind, name: string) =>
  kind === "user" ? { user: name } : { group: name };

test.describe("Roles", () => {
  test.describe("List", () => {
    /**
     * ROL-LIST-01 · Row content
     *
     * Summary: The Roles list shows each role's name, plugin, description, permission count and locked state.
     *
     * When I open Roles from the Administration navigation
     * Then the heading is "Roles", the Roles nav item is highlighted, and the column headers are Name,
     * Plugin, Description, Permissions, Locked, actions
     * And each row shows the role name as plain text (not a link), its Plugin, its Description (or "—",
     * long text truncated), its Permissions count, and a Locked label of Yes or No
     */
    test(
      "built-in locked roles show their plugin and Locked Yes",
      {
        tag: "@ROL-LIST-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-LIST-01",
        },
      },
      async ({ rolesPage, api, page }) => {
        // Reached from the Administration nav, which highlights the Roles item.
        await openViaNav(page, "Roles");
        await expect(page).toHaveTitle(/^Roles · /);
        for (const [name, plugin] of [["core.task_owner", "core"]]) {
          await findRole(rolesPage, name);
          const cells = rolesPage.exactRow(name).getByRole("gridcell");
          await expect(cells.nth(NAME)).toHaveText(name);
          await expect(cells.nth(NAME).getByRole("link")).toHaveCount(0);
          await expect(cells.nth(PLUGIN)).toHaveText(plugin);
          // Some built-in roles have no description.
          const role = await api.role(name);
          await expect(cells.nth(DESCRIPTION)).toHaveText(
            role?.description || "—",
          );
          await expect(cells.nth(PERMISSIONS)).toHaveText(
            String(role?.permissions.length),
          );
          await expect(cells.nth(LOCKED)).toHaveText("Yes");
        }
      },
    );

    const customRows: {
      label: string;
      name: () => string;
      description: string | null;
      permissions: string[];
      plugin: (name: string) => string;
      cell: string | "truncated";
    }[] = [
      {
        label: "custom.reader with a description",
        name: () => roleName((u) => `custom.${u}`),
        description: "Reads things",
        permissions: [VIEW_TASK],
        plugin: () => "custom",
        cell: "Reads things",
      },
    ];

    /**
     * ROL-LIST-01 · Row content
     *
     * Summary: The Roles list shows each role's name, plugin, description, permission count and locked state.
     *
     * When I open Roles from the Administration navigation
     * Then the heading is "Roles", the Roles nav item is highlighted, and the column headers are Name,
     * Plugin, Description, Permissions, Locked, actions
     * And each row shows the role name as plain text (not a link), its Plugin, its Description (or "—",
     * long text truncated), its Permissions count, and a Locked label of Yes or No
     */
    test(
      "custom roles",
      {
        tag: "@ROL-LIST-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-LIST-01",
        },
      },
      async ({ rolesPage, api, cleanup }) => {
        // Seed every row once, then assert each on a single page load.
        const seeded = await Promise.all(
          customRows.map(async (row) => {
            const name = cleanup.role(row.name());
            await api.createRole({
              name,
              description: row.description,
              permissions: row.permissions,
            });
            return { row, name };
          }),
        );
        await rolesPage.goto();
        for (const { row, name } of seeded) {
          await test.step(row.label, async () => {
            await rolesPage.filterBy("Name", name);
            await expect(rolesPage.exactRow(name)).toBeVisible();
            const cells = rolesPage.exactRow(name).getByRole("gridcell");
            await expect(cells.nth(NAME)).toHaveText(name);
            await expect(cells.nth(NAME).getByRole("link")).toHaveCount(0);
            await expect(cells.nth(PLUGIN)).toHaveText(row.plugin(name));
            if (row.cell === "truncated") {
              // The cell keeps the whole text but cuts it off with an ellipsis.
              await expect
                .poll(() =>
                  cells
                    .nth(DESCRIPTION)
                    .evaluate((cell) => cell.scrollWidth > cell.clientWidth),
                )
                .toBe(true);
            } else {
              await expect(cells.nth(DESCRIPTION)).toHaveText(row.cell);
            }
            await expect(cells.nth(PERMISSIONS)).toHaveText(
              String(row.permissions.length),
            );
            await expect(cells.nth(LOCKED)).toHaveText("No");
          });
        }
      },
    );

    const comboRows: {
      option: "All roles" | "Locked" | "Unlocked";
      filter: "" | "match" | "no-match";
      sort:
        | "Name ascending"
        | "Name descending"
        | "Locked ascending"
        | "Locked descending";
      rows: string;
    }[] = [
      // Main cases (each Locked option once, combined with the name filter and sort).
      {
        option: "All roles",
        filter: "",
        sort: "Locked descending",
        rows: "every role, locked first",
      },
      {
        option: "Locked",
        filter: "match",
        sort: "Name ascending",
        rows: "the seeded locked role",
      },
      {
        option: "Unlocked",
        filter: "match",
        sort: "Name ascending",
        rows: "the seeded unlocked role",
      },
      {
        option: "Unlocked",
        filter: "no-match",
        sort: "Name ascending",
        rows: "none",
      },
    ];

    /**
     * ROL-LIST-03 · Locked filter combined with name filter and sort
     *
     * Summary: The Locked filter narrows the Roles list and composes with the name filter and sort.
     *
     * Seed: an unlocked role whose name shares a text with a built-in locked role (`e2e-match`); Pulp
     * can't create locked roles, so the locked one is built in
     *
     * When I choose Locked <option>, type <name filter> and sort by <sort>
     * Then the listed rows are exactly <rows>, in the sort order
     *
     * | option    | name filter | sort              | rows                      |
     * | --------- | ----------- | ----------------- | ------------------------- |
     * | All roles | (empty)     | Locked descending | every role, locked first  |
     * | Locked    | e2e-match   | Name ascending    | the seeded locked role    |
     * | Unlocked  | e2e-match   | Name ascending    | the seeded unlocked role  |
     * | Unlocked  | no-match    | Name ascending    | none — "No results found" |
     */
    test(
      "The Locked filter narrows the Roles list and composes with the name filter and sort.",
      {
        tag: "@ROL-LIST-03",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-LIST-03",
        },
      },
      async ({ rolesPage, api, cleanup }) => {
        test.slow();
        for (const row of comboRows) {
          await test.step(`${row.option}, filter "${row.filter || "(empty)"}", ${row.sort} → ${row.rows}`, async () => {
            // The locked half of the seed is the built-in file.filerepository_owner:
            // Pulp can't create locked roles, so the shared text is its codename.
            const match = "filerepository_owner";
            const lockedSeed = "file.filerepository_owner";
            const unlockedSeed = cleanup.role(roleName((u) => `${u}.${match}`));
            await api.createRole({ name: unlockedSeed });
            try {
              const filter =
                row.filter === "match"
                  ? match
                  : row.filter === "no-match"
                    ? uniqueName("none")
                    : "";

              await rolesPage.goto();
              await rolesPage.filterLocked(row.option);
              if (filter) await rolesPage.filterBy("Name", filter);
              await rolesPage.list.expectLoaded();
              const [column, direction] = row.sort.split(" ") as [
                string,
                string,
              ];
              const clicks =
                column === "Name"
                  ? direction === "descending"
                    ? 1
                    : 0
                  : direction === "ascending"
                    ? 1
                    : 2;
              const header = rolesPage.list.columnHeader(column);
              for (let click = 1; click <= clicks; click++) {
                await header.getByRole("button").click();
                await rolesPage.list.expectSorted(
                  column,
                  click === 1 && column === "Locked"
                    ? "ascending"
                    : (direction as "ascending"),
                );
              }
              await rolesPage.list.expectSorted(
                column,
                direction as "ascending",
              );
              await rolesPage.list.expectLoaded();

              if (row.filter === "no-match") {
                await expect(
                  rolesPage.list.stateHeading("No results found"),
                ).toBeVisible();
                return;
              }

              const params: Record<string, string> = {
                ordering: `${direction === "descending" ? "-" : ""}${column.toLowerCase()}`,
              };
              if (row.option !== "All roles")
                params.locked = String(row.option === "Locked");
              if (filter) params.name__icontains = filter;
              if (row.option === "Locked") {
                const { count } = await apiRolesPage(api, params);
                await rolesPage.list
                  .paginator()
                  .expectRange(new RegExp(`of ${count}\\s*$`));
              }

              if (row.filter === "match") {
                const seeded =
                  row.option === "Locked"
                    ? [lockedSeed]
                    : row.option === "Unlocked"
                      ? [unlockedSeed]
                      : column === "Locked"
                        ? [unlockedSeed, lockedSeed]
                        : [lockedSeed, unlockedSeed].sort();
                await expect
                  .poll(() => rolesPage.list.columnTexts("Name"))
                  .toEqual(seeded);
              } else if (column === "Name") {
                // Other tests add and remove roles meanwhile, so compare the order
                // of the rows shown with the server's order of those same names.
                const names = await rolesPage.list.columnTexts("Name");
                const labels = await rolesPage.list.columnTexts("Locked");
                if (row.option !== "All roles") {
                  expect(new Set(labels)).toEqual(
                    new Set([row.option === "Locked" ? "Yes" : "No"]),
                  );
                }
                const ordered = await apiRolesPage(api, {
                  ordering: params.ordering,
                  name__in: names.join(","),
                });
                expect(names).toEqual(ordered.results.map((role) => role.name));
              } else {
                // Ties within a Locked value have no fixed order: check grouping.
                const labels = await rolesPage.list.columnTexts("Locked");
                const sorted = [...labels].sort();
                expect(labels).toEqual(
                  direction === "ascending" ? sorted : sorted.reverse(),
                );
              }
            } finally {
              // Remove this row's seed so a later "match" step sees only its own.
              await api.deleteRole(unlockedSeed);
            }
          });
        }
      },
    );

    /**
     * ROL-LIST-06 · A non-superuser cannot read the Roles list
     *
     * Summary: A non-superuser opening the Roles list sees “403: Access denied”.
     *
     * Auth: second-user
     *
     * Given a second user who is not a superuser
     * When they open the Roles list
     * Then the table shows "403: Access denied" (Pulp lets only superusers list roles)
     */
    test(
      "A non-superuser opening the Roles list sees “403: Access denied”.",
      {
        tag: "@ROL-LIST-06",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-LIST-06",
        },
      },
      async ({ secondUser }) => {
        const user = await secondUser.create();
        const page = await secondUser.login(user);
        await page.goto("/admin/roles");
        const table = new DataTable(page.getByRole("main"), "Roles table");
        await expect(table.stateHeading("403: Access denied")).toBeVisible();
      },
    );
  });

  test.describe("Locked roles", () => {
    /**
     * ROL-LOCK-01 · Locked roles cannot be edited or deleted
     *
     * Summary: A locked role's Edit and Delete are disabled with tooltips; an unlocked role's are enabled.
     *
     * When I open the row actions of a role with Locked <locked>
     * Then Edit is <edit> and Delete is <delete>, and clicking a disabled action opens nothing
     *
     * | locked | edit                                              | delete                                             |
     * | ------ | ------------------------------------------------- | -------------------------------------------------- |
     * | Yes    | disabled, tooltip "Locked roles cannot be edited" | disabled, tooltip "Locked roles cannot be deleted" |
     * | No     | enabled                                           | enabled                                            |
     *
     * Pulp itself refuses to change or delete a locked role ("The role is locked."), so the disabled
     * actions match the backend.
     */
    test(
      "Locked Yes: Edit and Delete disabled with tooltips, clicking opens nothing",
      {
        tag: "@ROL-LOCK-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-LOCK-01",
        },
      },
      async ({ rolesPage, page }) => {
        await findRole(rolesPage, LOCKED_ROLE);
        for (const [action, tooltip] of [
          ["Edit", "Locked roles cannot be edited"],
          ["Delete", "Locked roles cannot be deleted"],
        ]) {
          await rolesPage.openRowMenu(LOCKED_ROLE);
          const item = rolesPage.menuItem(action);
          await expect(item).toHaveAttribute("aria-disabled", "true");
          await item.hover();
          await expect(page.getByRole("tooltip")).toHaveText(tooltip);
          await item.click({ force: true });
          await expect(page.getByRole("dialog")).toHaveCount(0);
          await page.keyboard.press("Escape");
        }
      },
    );

    /**
     * ROL-LOCK-01 · Locked roles cannot be edited or deleted
     *
     * Summary: A locked role's Edit and Delete are disabled with tooltips; an unlocked role's are enabled.
     *
     * When I open the row actions of a role with Locked <locked>
     * Then Edit is <edit> and Delete is <delete>, and clicking a disabled action opens nothing
     *
     * | locked | edit                                              | delete                                             |
     * | ------ | ------------------------------------------------- | -------------------------------------------------- |
     * | Yes    | disabled, tooltip "Locked roles cannot be edited" | disabled, tooltip "Locked roles cannot be deleted" |
     * | No     | enabled                                           | enabled                                            |
     *
     * Pulp itself refuses to change or delete a locked role ("The role is locked."), so the disabled
     * actions match the backend.
     */
    test(
      "Locked No: Edit and Delete enabled",
      {
        tag: "@ROL-LOCK-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-LOCK-01",
        },
      },
      async ({ rolesPage, api, cleanup }) => {
        const name = cleanup.role(roleName((u) => `custom.${u}`));
        await api.createRole({ name });
        await findRole(rolesPage, name);
        await rolesPage.openRowMenu(name);
        for (const action of ["Edit", "Delete"]) {
          await expect(rolesPage.menuItem(action)).not.toHaveAttribute(
            "aria-disabled",
            "true",
          );
        }
      },
    );

    /**
     * ROL-LOCK-02 · Locked roles can still be assigned
     *
     * Summary: A locked role is still listed and selectable in Add Role, and assigning it succeeds.
     *
     * When I open "Add Role" for a user or group
     * Then locked roles are listed and selectable, and adding one succeeds
     */
    test(
      "A locked role is still listed and selectable in Add Role, and assigning it succeeds.",
      {
        tag: "@ROL-LOCK-02",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-LOCK-02",
        },
      },
      async ({ page, api, cleanup, toasts }) => {
        test.slow();
        for (const kind of ["user", "group"] as const) {
          await test.step(`added to a ${kind}`, async () => {
            const owner = await seedOwner({ api, cleanup, kind });
            const tab = await openRolesTab({ page, api, kind, owner });
            const modal = await tab.openAdd();
            await modal.table.filter("Role", LOCKED_ROLE);
            const checkbox = modal.table.rows
              .filter({
                has: page.getByRole("gridcell", {
                  name: LOCKED_ROLE,
                  exact: true,
                }),
              })
              .getByRole("checkbox");
            await expect(checkbox).toBeEnabled();
            await checkbox.check();
            await modal.addButton().click();
            await expect(
              toasts.success(`1 role added to ${kind} "${owner}"`),
            ).toBeVisible();
            await expect(tab.rows(LOCKED_ROLE)).toHaveCount(1);
          });
        }
      },
    );
  });

  test.describe("Create", () => {
    // ROL-CRE-01 (form fields) and the client "required" validation are component
    // tests (RoleModal.test.tsx). ROL-CRE-02 (server name rules) and ROL-CRE-04
    // (server permission rules) are api contract tests (roles.api.spec.ts);
    // description display incl. the list ellipsis is covered by ROL-LIST-01. This
    // is the create UI journey.

    /**
     * ROL-CRE-05 · Create a role
     *
     * Summary: Creating a role with a name and permissions shows a success toast and the role in the list, unlocked.
     *
     * When I click "Create Role", enter a name and one or more permissions, and submit
     * Then the modal closes, the toast `Role "<name>" created` appears, and the role is in the Roles
     * list with Locked No and the permissions I added
     */
    test(
      "Creating a role with a name and permissions shows a success toast and the role in the list, unlocked.",
      {
        tag: ["@smoke", "@ROL-CRE-05"],
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-CRE-05",
        },
      },
      async ({ rolesPage, cleanup, toasts }) => {
        const name = cleanup.role(roleName((u) => `custom.${u}`));
        await rolesPage.goto();
        await rolesPage.create({ name });
        await expect(toasts.success(`Role "${name}" created`)).toBeVisible();
        await rolesPage.filterBy("Name", name);
        await expect(
          rolesPage.exactRow(name).getByRole("gridcell").nth(LOCKED),
        ).toHaveText("No");
      },
    );

    /**
     * ROL-CRE-06 · Create is not gated for a non-superuser
     *
     * Summary: A non-superuser can open Create role, but submitting a valid form fails with a permission-denied error in the form.
     *
     * Auth: second-user
     *
     * Given a second user without permission to add roles
     * Then "Create Role" is enabled, and submitting a valid form shows the in-form error title "Failed
     * to create role" with the text "You do not have permission to perform this action. Ask an
     * administrator to grant the required role."
     */
    test(
      "A non-superuser can open Create role, but submitting a valid form fails with a permission-denied error in the form.",
      {
        tag: "@ROL-CRE-06",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-CRE-06",
        },
      },
      async ({ cleanup, secondUser }) => {
        const user = await secondUser.create();
        const page = await secondUser.login(user);
        const roles = new RolesPage(page);
        await roles.goto();
        const modal = await roles.openCreate();
        await modal
          .field("Name")
          .fill(cleanup.role(roleName((u) => `custom.${u}`)));
        await modal.button("Create").click();
        await modal.expectSubmitError(
          "You do not have permission to perform this action. Ask an administrator to grant the required role.",
        );
      },
    );
  });

  test.describe("Permission input", () => {
    const openTags = async (rolesPage: RolesPage) => {
      await rolesPage.goto();
      const modal = await rolesPage.openCreate();
      return { modal, tags: new PermissionTags(modal.dialog) };
    };

    /**
     * ROL-PERM-01 · A permission that saves with a server error
     *
     * Summary: Adding a non-existent or wrong-case permission and saving fails with the server's exact “does not exist” error.
     *
     * When I create a role and add a permission that does not exist (`core.not_a_permission`), and also
     * add `core.view_task` then `Core.view_task`, and save
     * Then the save fails with the server's reason — "Permission 'core.not_a_permission' does not
     * exist." or "Permission 'Core.view_task' does not exist." — Pulp matches codenames exactly, so
     * `Core.view_task` is a different, unknown permission
     */
    test(
      `add ${VIEW_TASK}, then Core.view_task → two tags; saving fails`,
      {
        tag: "@ROL-PERM-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-PERM-01",
        },
      },
      async ({ rolesPage, cleanup }) => {
        const { modal, tags } = await openTags(rolesPage);
        await modal
          .field("Name")
          .fill(cleanup.role(roleName((u) => `custom.${u}`)));
        await tags.add(VIEW_TASK, "Core.view_task");
        await expect
          .poll(async () => (await tags.visible()).sort())
          .toEqual(["Core.view_task", VIEW_TASK].sort());
        await modal.button("Create").click();
        await modal.expectSubmitError(
          "Permission 'Core.view_task' does not exist.",
        );
      },
    );
  });

  test.describe("Edit", () => {
    const seedRole = async (
      api: PulpApi,
      cleanup: { role: (n: string) => string },
    ) => {
      const name = cleanup.role(roleName((u) => `custom.${u}`));
      await api.createRole({
        name,
        description: "Before",
        permissions: [VIEW_TASK, CHANGE_TASK],
      });
      return name;
    };

    // ROL-EDT-01 (the edit form's fields/disabled Name/saved values) is a
    // component test (RoleModal.test.tsx).

    // Main cases (change description, add, and remove — each at least once).
    const editRows: {
      description: "keep" | "change";
      add: boolean;
      remove: "nothing" | "a" | "both";
    }[] = [
      { description: "keep", add: true, remove: "a" },
      { description: "change", add: false, remove: "nothing" },
      { description: "keep", add: false, remove: "both" },
    ];

    /**
     * ROL-EDT-02 · Changing description and permissions
     *
     * Summary: Editing a role's description and adding/removing permissions saves the changes with a toast.
     *
     * Given an unlocked role with a description and permissions `a.x`, `b.x`
     * When I change the description, add a permission and remove one, and save
     * Then the modal closes, the toast `Role "<name>" updated` appears, and the saved role matches
     *
     * | description change   | add change  | remove change |
     * | -------------------- | ----------- | ------------- |
     * | change it            | add `c.x`   | remove `a.x`  |
     * | keep the description | add nothing | remove both   |
     */
    test(
      "Editing a role's description and adding/removing permissions saves the changes with a toast.",
      {
        tag: "@ROL-EDT-02",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-EDT-02",
        },
      },
      async ({ rolesPage, api, cleanup, toasts }) => {
        test.slow();
        for (const row of editRows) {
          await test.step(`${row.description} the description, add ${row.add ? "c.x" : "nothing"}, remove ${row.remove === "a" ? "a.x" : row.remove}`, async () => {
            // a.x, b.x, c.x of the spec: real codenames, a.x = view, b.x = change.
            const name = await seedRole(api, cleanup);
            await findRole(rolesPage, name);
            const modal = await rolesPage.openEdit(name);
            const tags = new PermissionTags(modal.dialog);
            if (row.description === "change")
              await modal.field("Description").fill("After");
            if (row.add) await tags.add(DELETE_TASK);
            if (row.remove !== "nothing")
              await tags.removeButton(VIEW_TASK).click();
            if (row.remove === "both")
              await tags.removeButton(CHANGE_TASK).click();
            await modal.button("Save").click();
            await modal.expectClosed();
            await expect(
              toasts.success(`Role "${name}" updated`),
            ).toBeVisible();

            const expected = [VIEW_TASK, CHANGE_TASK]
              .filter(
                (p) =>
                  row.remove === "nothing" ||
                  (row.remove === "a" && p !== VIEW_TASK),
              )
              .concat(row.add ? [DELETE_TASK] : [])
              .sort();
            await expect
              .poll(async () => {
                const role = await api.role(name);
                return {
                  description: role?.description,
                  permissions: [...(role?.permissions ?? [])].sort(),
                };
              })
              .toEqual({
                description: row.description === "change" ? "After" : "Before",
                permissions: expected,
              });
          });
        }
      },
    );

    // ROL-EDT-03 (clearing the description: the null-vs-empty server rule) is an
    // api contract test (roles.api.spec.ts); the shared "form omits an empty field"
    // UI gap is kept once as USR-EDT-05. ROL-EDT-04 (server rejection of an unknown
    // permission on edit) is covered by FORM-09 + the api contract test.

    /**
     * ROL-EDT-05 · Changes reach the assignments
     *
     * Summary: Adding a permission to a role raises its permission count on the list and on the user's and group's Roles tabs.
     *
     * Given role R is assigned to a user and a group
     * When I add a permission to R
     * Then the Permissions count of R rises in the Roles list, the user's Roles tab and the group's
     * Roles tab
     */
    test(
      "Adding a permission to a role raises its permission count on the list and on the user's and group's Roles tabs.",
      {
        tag: "@ROL-EDT-05",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-EDT-05",
        },
      },
      async ({ rolesPage, api, cleanup, page }) => {
        const name = await seedRole(api, cleanup);
        const user = await seedOwner({ api, cleanup, kind: "user" });
        const group = await seedOwner({ api, cleanup, kind: "group" });
        await api.assignRole({ user }, { role: name });
        await api.assignRole({ group }, { role: name });

        await findRole(rolesPage, name);
        const modal = await rolesPage.openEdit(name);
        await new PermissionTags(modal.dialog).add(DELETE_TASK);
        await modal.button("Save").click();
        await modal.expectClosed();
        await expect(
          rolesPage.exactRow(name).getByRole("gridcell").nth(PERMISSIONS),
        ).toHaveText("3");

        for (const [kind, owner] of [
          ["user", user],
          ["group", group],
        ] as const) {
          const tab = await openRolesTab({ page, api, kind, owner });
          await expect(tab.rows(name).getByRole("gridcell").nth(2)).toHaveText(
            "3",
          );
        }
      },
    );
  });

  test.describe("Delete", () => {
    /**
     * ROL-DEL-01 · Delete
     *
     * Summary: Deleting a role removes it and cascades to its assignments, removing them from holders.
     *
     * Given an unlocked role <assigned>
     * When I open "Delete" from the Roles list and confirm
     * Then the dialog "Delete Role" shows `Are you sure you want to delete the role "<name>"? This
     * action cannot be undone.`, and on confirming the toast `Role "<name>" deleted` appears and
     * <outcome>
     *
     * | assigned               | outcome                                                                             |
     * | ---------------------- | ----------------------------------------------------------------------------------- |
     * | not assigned to anyone | the role is gone                                                                    |
     * | assigned to a user     | the role is gone, and so is the assignment: the user's Roles tab no longer lists it |
     *
     * Pulp deletes a role's assignments with it, without warning; the holders lose the permissions the
     * role gave them.
     */
    test(
      "Deleting a role removes it and cascades to its assignments, removing them from holders.",
      {
        tag: "@ROL-DEL-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/roles.md#ROL-DEL-01",
        },
      },
      async ({ rolesPage, api, cleanup, page, toasts }) => {
        test.slow();
        // Main cases (unassigned, and assigned — the assignment cascades).
        for (const assigned of [
          "not assigned to anyone",
          "assigned to a user",
        ] as const) {
          await test.step(`delete a role ${assigned}`, async () => {
            const name = cleanup.role(roleName((u) => `file.${u}`));
            await api.createRole({
              name,
              permissions: ["file.view_filerepository"],
            });
            let owner: { kind: RoleOwnerKind; name: string } | undefined;
            if (assigned === "assigned to a user") {
              owner = {
                kind: "user",
                name: await seedOwner({ api, cleanup, kind: "user" }),
              };
              await api.assignRole(ownerRef(owner.kind, owner.name), {
                role: name,
              });
            }

            await findRole(rolesPage, name);
            await rolesPage.delete(name);
            await expect(
              toasts.success(`Role "${name}" deleted`),
            ).toBeVisible();
            await rolesPage.expectRowGone(name);
            expect(await api.role(name)).toBeUndefined();

            if (owner) {
              // Pulp deletes the role's assignments with it.
              expect(
                await api.roleAssignments(ownerRef(owner.kind, owner.name)),
              ).toEqual([]);
              const tab = await openRolesTab({
                page,
                api,
                kind: owner.kind,
                owner: owner.name,
              });
              await expect(
                tab.table.stateHeading(
                  `No roles assigned to this ${owner.kind}`,
                ),
              ).toBeVisible();
            }
          });
        }
      },
    );
  });
});
