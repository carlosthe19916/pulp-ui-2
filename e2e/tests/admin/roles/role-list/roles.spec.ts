import type { Page } from "@playwright/test";

import { expect, test } from "../../../fixtures";
import type { PulpApi } from "../../../helpers/pulp-api";
import { uniqueName } from "../../../helpers/unique";
import { PermissionTags } from "../../../pom/PermissionTags";
import {
  RoleAssignmentsTab,
  type RoleOwnerKind,
} from "../../../pom/RoleAssignmentsTab";
import type { RolesPage } from "../../../pom/RolesPage";

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
  // The detail route suspends until its record loads, which is slow under load.
  await expect(
    page.getByRole("heading", { level: 1, name: owner }),
  ).toBeVisible({
    timeout: 15_000,
  });
  const tab = new RoleAssignmentsTab(page, kind);
  await tab.open();
  return tab;
};

const ownerRef = (kind: RoleOwnerKind, name: string) =>
  kind === "user" ? { user: name } : { group: name };

test.describe("Roles", () => {
  test.describe("List", () => {
    test("ROL-LIST-01 built-in locked roles show their plugin and Locked Yes", async ({
      rolesPage,
      api,
    }) => {
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
    });

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
      {
        label: "reader (no dot)",
        name: () => roleName((u) => u),
        description: null,
        permissions: [],
        plugin: () => "other",
        cell: "—",
      },
      {
        label: "custom.long with a 500-character description",
        name: () => roleName((u) => `custom.${u}`),
        description: "d".repeat(500),
        permissions: [],
        plugin: () => "custom",
        cell: "truncated",
      },
    ];

    test("ROL-LIST-01 custom roles", async ({ rolesPage, api, cleanup }) => {
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
    });

    test("ROL-LIST-02 Locked filter", async ({ rolesPage, api, cleanup }) => {
      for (const [option, expected] of [
        ["All roles", ["Yes", "No"]],
        ["Locked", ["Yes"]],
        ["Unlocked", ["No"]],
      ] as const) {
        await test.step(`Locked filter "${option}"`, async () => {
          // "task" matches the locked core.task_* roles and this unlocked seed, so
          // page 1 holds both kinds unless the Locked filter removes one.
          const name = cleanup.role(roleName((u) => `custom.task-${u}`));
          await api.createRole({ name });
          await rolesPage.goto();
          await rolesPage.filterBy("Name", "task");
          await rolesPage.filterLocked(option);
          await expect(rolesPage.lockedToggle()).toHaveText(option);
          if (option === "Locked") {
            // Only built-in roles are locked, so their count is stable.
            const { count } = await apiRolesPage(api, {
              locked: "true",
              name__icontains: "task",
            });
            await rolesPage.list
              .paginator()
              .expectRange(new RegExp(`of ${count}\\s*$`));
          }
          const labels = await rolesPage.list.columnTexts("Locked");
          expect([...new Set(labels)].sort()).toEqual([...expected].sort());
        });
      }
    });

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

    test("ROL-LIST-03 combinations", async ({ rolesPage, api, cleanup }) => {
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
            const [column, direction] = row.sort.split(" ") as [string, string];
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
            await rolesPage.list.expectSorted(column, direction as "ascending");
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
    });

    const clearRows: {
      option: "All roles" | "Locked" | "Unlocked";
      filter: "" | "match" | "no-match";
      clear: "toolbar" | "empty state";
    }[] = [
      // Main cases (clear from the toolbar, and clear from the empty state).
      { option: "Unlocked", filter: "match", clear: "toolbar" },
      { option: "Unlocked", filter: "no-match", clear: "empty state" },
    ];

    test("ROL-LIST-04 Clearing both filters", async ({ rolesPage }) => {
      for (const row of clearRows) {
        await test.step(`${row.option}, filter "${row.filter || "(empty)"}", "Clear all filters" in the ${row.clear}`, async () => {
          const filter =
            row.filter === "match"
              ? "task"
              : row.filter === "no-match"
                ? uniqueName("none")
                : "";
          await rolesPage.goto();
          await rolesPage.filterLocked(row.option);
          if (filter) await rolesPage.filterBy("Name", filter);
          const button =
            row.clear === "toolbar"
              ? rolesPage.list.clearAllFiltersInToolbar()
              : rolesPage.list.clearAllFiltersInEmptyState();
          await button.click();
          await expect(rolesPage.list.filterInput("Name")).toHaveValue("");
          await expect(rolesPage.lockedToggle()).toHaveText("All roles");
          await rolesPage.list.paginator().expectRange(/^1 - 10 of \d+\s*$/);
          await expect(rolesPage.list.clearAllFiltersInToolbar()).toHaveCount(
            0,
          );
        });
      }
    });

    test("ROL-LIST-05 Unlocked with a locked role's name gives the filtered empty state", async ({
      rolesPage,
    }) => {
      await rolesPage.goto();
      await rolesPage.filterBy("Name", LOCKED_ROLE);
      await expect(rolesPage.exactRow(LOCKED_ROLE)).toBeVisible();
      await rolesPage.filterLocked("Unlocked");
      await expect(
        rolesPage.list.stateHeading("No results found"),
      ).toBeVisible();
      await expect(rolesPage.list.clearAllFiltersInEmptyState()).toBeVisible();
    });
  });

  test.describe("Locked roles", () => {
    test("ROL-LOCK-01 Locked Yes: Edit and Delete disabled with tooltips, clicking opens nothing", async ({
      rolesPage,
      page,
    }) => {
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
    });

    test("ROL-LOCK-01 Locked No: Edit and Delete enabled", async ({
      rolesPage,
      api,
      cleanup,
    }) => {
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
    });

    test("ROL-LOCK-02 a locked role can be added to an owner", async ({
      page,
      api,
      cleanup,
      toasts,
    }) => {
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
    });
  });

  test.describe("Create", () => {
    // ROL-CRE-01 (form fields) and the client "required" validation are component
    // tests (RoleModal.test.tsx). ROL-CRE-02 (server name rules) and ROL-CRE-04
    // (server permission rules) are api contract tests (roles.api.spec.ts);
    // description display incl. the list ellipsis is covered by ROL-LIST-01. This
    // is the create UI journey.

    test(
      "ROL-CRE-05 the new role appears",
      { tag: "@smoke" },
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
  });

  test.describe("Permission input", () => {
    const openTags = async (rolesPage: RolesPage) => {
      await rolesPage.goto();
      const modal = await rolesPage.openCreate();
      return { modal, tags: new PermissionTags(modal.dialog) };
    };

    test(`ROL-PERM-01 add ${VIEW_TASK}, then Core.view_task → two tags; saving fails`, async ({
      rolesPage,
      cleanup,
    }) => {
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
    });
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

    test("ROL-EDT-02 changing description and permissions", async ({
      rolesPage,
      api,
      cleanup,
      toasts,
    }) => {
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
          await expect(toasts.success(`Role "${name}" updated`)).toBeVisible();

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
    });

    // ROL-EDT-03 (clearing the description: the null-vs-empty server rule) is an
    // api contract test (roles.api.spec.ts); the shared "form omits an empty field"
    // UI gap is kept once as USR-EDT-05. ROL-EDT-04 (server rejection of an unknown
    // permission on edit) is covered by FORM-09 + the api contract test.

    test("ROL-EDT-05 changes reach the assignments", async ({
      rolesPage,
      api,
      cleanup,
      page,
    }) => {
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
    });
  });

  test.describe("Delete", () => {
    test("ROL-DEL-01 delete a role", async ({
      rolesPage,
      api,
      cleanup,
      page,
      toasts,
    }) => {
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
          await expect(toasts.success(`Role "${name}" deleted`)).toBeVisible();
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
              tab.table.stateHeading(`No roles assigned to this ${owner.kind}`),
            ).toBeVisible();
          }
        });
      }
    });
  });

  test.describe("Role assignments", () => {
    test("ROLE-ASSIGN-01 row content", async ({ page, api, cleanup }) => {
      test.slow();
      // Main cases (user global, group on an object, one domain scope).
      const scopeRows = [
        { kind: "user", scope: "globally" },
        { kind: "group", scope: "on one repository" },
        { kind: "user", scope: "in one domain" },
      ] as const;
      for (const { kind, scope } of scopeRows) {
        await test.step(`${kind} has a role assigned ${scope}`, async (step) => {
          if (scope === "in one domain") {
            step.skip(
              !api.domainEnabled,
              "domains are disabled on this backend",
            );
          }
          const role = cleanup.role(roleName((u) => `file.${u}`));
          await api.createRole({
            name: role,
            description: "Views repositories",
            permissions: ["file.view_filerepository"],
          });
          const owner = await seedOwner({ api, cleanup, kind });
          let contentObject: string | null = null;
          let domain: string | null = null;
          if (scope === "on one repository") {
            const repo = cleanup.repository(uniqueName("repo"));
            contentObject = (await api.createFileRepository(repo)).pulp_href;
          } else if (scope === "in one domain") {
            domain = await api.defaultDomainHref();
          }
          await api.assignRole(ownerRef(kind, owner), {
            role,
            contentObject,
            domain,
          });

          const tab = await openRolesTab({ page, api, kind, owner });
          const cells = tab.rows(role).getByRole("gridcell");
          await expect(cells.nth(0)).toHaveText(role);
          await expect(cells.nth(1)).toHaveText("Views repositories");
          await expect(cells.nth(2)).toHaveText("1");
          await expect(cells.nth(3)).not.toHaveText("—");
          await expect(cells.nth(3)).toHaveText(/\d/);
        });
      }
      // Open: Pulp returns each assignment's object or domain but the row hides
      // it, so a role assigned twice (globally and on an object) shows as two
      // identical rows; decide whether the row should show the scope.
      await test.step.skip("the row shows the assignment's scope", () => {});
    });

    // Run for owner = user; the group Roles tab uses the same tab and modal.
    test("ROLE-ASSIGN-02 add roles", async ({ page, api, cleanup, toasts }) => {
      test.slow();
      for (const kind of ["user"] as const) {
        for (const n of [1, 2]) {
          await test.step(`add ${n} role(s) to a ${kind}`, async () => {
            const roles = Array.from({ length: n }, () =>
              cleanup.role(roleName((u) => `custom.${u}`)),
            );
            for (const name of roles) await api.createRole({ name });
            const owner = await seedOwner({ api, cleanup, kind });
            const tab = await openRolesTab({ page, api, kind, owner });
            await tab.add(roles);
            await expect(
              toasts.success(
                `${n} ${n === 1 ? "role" : "roles"} added to ${kind} "${owner}"`,
              ),
            ).toBeVisible();
            for (const name of roles) {
              await expect(
                tab.rows(name).getByRole("gridcell").nth(3),
              ).toHaveText(/\d/);
            }
          });
        }
      }
    });

    test("ROLE-ASSIGN-03 remove one assignment of a role held twice", async ({
      page,
      api,
      cleanup,
    }) => {
      test.slow();
      for (const kind of ["user"] as const) {
        await test.step(`a ${kind} holds it twice`, async () => {
          const role = cleanup.role(roleName((u) => `file.${u}`));
          await api.createRole({
            name: role,
            permissions: ["file.view_filerepository"],
          });
          const owner = await seedOwner({ api, cleanup, kind });
          const repo = cleanup.repository(uniqueName("repo"));
          const { pulp_href } = await api.createFileRepository(repo);
          await api.assignRole(ownerRef(kind, owner), { role });
          await api.assignRole(ownerRef(kind, owner), {
            role,
            contentObject: pulp_href,
          });

          const tab = await openRolesTab({ page, api, kind, owner });
          await expect(tab.rows(role)).toHaveCount(2);
          await tab.remove(tab.rows(role).first());
          await expect(tab.rows(role)).toHaveCount(1);
          await expect
            .poll(
              async () =>
                (await api.roleAssignments(ownerRef(kind, owner))).length,
            )
            .toBe(1);
        });
      }
    });

    test("ROLE-ASSIGN-04 a non-superuser who may view a group cannot read its role assignments", async ({
      api,
      cleanup,
      secondUser,
    }) => {
      const group = cleanup.group(uniqueName("group"));
      const { id } = await api.createGroup(group);
      const viewer = await secondUser.create();
      await api.assignRole(
        { user: viewer.username },
        {
          role: "core.group_viewer",
          contentObject: (await api.group(group))?.pulp_href,
        },
      );

      const page = await secondUser.login(viewer);
      await page.goto(`/admin/groups/${id}`);
      await expect(
        page.getByRole("heading", { level: 1, name: group }),
      ).toBeVisible();
      const tab = new RoleAssignmentsTab(page, "group");
      await expect(tab.tab).toHaveText("Roles (0)");
      await tab.open();
      await expect(tab.table.stateHeading("403: Access denied")).toBeVisible();
      await expect(tab.addButton()).toBeEnabled();
      const modal = await tab.openAdd();
      await expect(
        modal.table.stateHeading("403: Access denied"),
      ).toBeVisible();
    });

    // ROLE-ASSIGN-05 (a role takes effect) uses the same my_permissions/ mechanism
    // as the one representative RBAC-effect e2e, GRP-USR-06 in
    // group-details.spec.ts; not tested separately.
  });
});
