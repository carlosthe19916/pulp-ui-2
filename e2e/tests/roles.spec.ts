import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import type { PulpApi } from "./helpers/pulp-api";
import { uniqueName } from "./helpers/unique";
import { DataTable } from "./pom/DataTable";
import { PermissionTags } from "./pom/PermissionTags";
import {
  RoleAssignmentsTab,
  type RoleOwnerKind,
} from "./pom/RoleAssignmentsTab";
import type { RolesPage } from "./pom/RolesPage";

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
      for (const [name, plugin] of [
        ["core.task_owner", "core"],
        ["file.filerepository_owner", "file"],
      ]) {
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
        label: "a.b.c with 2 permissions",
        name: () => roleName((u) => `a.b.${u}`),
        description: null,
        permissions: [VIEW_TASK, CHANGE_TASK],
        plugin: () => "a",
        cell: "—",
      },
      {
        label: "trailing.",
        name: () => roleName((u) => `${u}.`),
        description: null,
        permissions: [],
        plugin: (name) => name.slice(0, -1),
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

    for (const row of customRows) {
      test(`ROL-LIST-01 ${row.label}`, async ({ rolesPage, api, cleanup }) => {
        const name = cleanup.role(row.name());
        await api.createRole({
          name,
          description: row.description,
          permissions: row.permissions,
        });
        await findRole(rolesPage, name);
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

    test("ROL-LIST-01 .leading (empty plugin)", async () => {
      test.fixme(
        true,
        "Open: a name starting with a dot gives an empty Plugin label; decide what to show",
      );
    });

    for (const [option, expected] of [
      ["All roles", ["Yes", "No"]],
      ["Locked", ["Yes"]],
      ["Unlocked", ["No"]],
    ] as const) {
      test(`ROL-LIST-02 Locked filter "${option}"`, async ({
        rolesPage,
        api,
        cleanup,
      }) => {
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
      {
        option: "All roles",
        filter: "",
        sort: "Name ascending",
        rows: "every role",
      },
      {
        option: "All roles",
        filter: "",
        sort: "Locked descending",
        rows: "every role, locked first",
      },
      {
        option: "All roles",
        filter: "match",
        sort: "Name ascending",
        rows: "both seeded roles",
      },
      {
        option: "All roles",
        filter: "match",
        sort: "Locked ascending",
        rows: "both, unlocked first",
      },
      {
        option: "All roles",
        filter: "no-match",
        sort: "Name ascending",
        rows: "none",
      },
      {
        option: "Locked",
        filter: "",
        sort: "Name ascending",
        rows: "every locked role",
      },
      {
        option: "Locked",
        filter: "",
        sort: "Name descending",
        rows: "every locked role, reversed",
      },
      {
        option: "Locked",
        filter: "match",
        sort: "Name ascending",
        rows: "the seeded locked role",
      },
      {
        option: "Locked",
        filter: "no-match",
        sort: "Name ascending",
        rows: "none",
      },
      {
        option: "Unlocked",
        filter: "",
        sort: "Name ascending",
        rows: "every unlocked role",
      },
      {
        option: "Unlocked",
        filter: "",
        sort: "Name descending",
        rows: "every unlocked role, reversed",
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

    test.describe("ROL-LIST-03 combinations", () => {
      // Every row seeds a role matching the same built-in locked role's codename, so
      // they must not overlap.
      test.describe.configure({ mode: "serial" });

      for (const row of comboRows) {
        test(`ROL-LIST-03 ${row.option}, filter "${row.filter || "(empty)"}", ${row.sort} → ${row.rows}`, async ({
          rolesPage,
          api,
          cleanup,
        }) => {
          // The locked half of the seed is the built-in file.filerepository_owner:
          // Pulp can't create locked roles, so the shared text is its codename.
          const match = "filerepository_owner";
          const lockedSeed = "file.filerepository_owner";
          const unlockedSeed = cleanup.role(roleName((u) => `${u}.${match}`));
          await api.createRole({ name: unlockedSeed });
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
            // Other tests add and remove roles meanwhile, so compare the order of the
            // rows shown with the server's order of those same names.
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
            // Ties within a Locked value have no fixed order: check the grouping only.
            const labels = await rolesPage.list.columnTexts("Locked");
            const sorted = [...labels].sort();
            expect(labels).toEqual(
              direction === "ascending" ? sorted : sorted.reverse(),
            );
          }
        });
      }
    });

    const clearRows: {
      option: "All roles" | "Locked" | "Unlocked";
      filter: "" | "match" | "no-match";
      clear: "toolbar" | "empty state";
    }[] = [
      { option: "Locked", filter: "", clear: "toolbar" },
      { option: "Unlocked", filter: "match", clear: "toolbar" },
      { option: "Locked", filter: "no-match", clear: "empty state" },
      { option: "Unlocked", filter: "no-match", clear: "empty state" },
      { option: "All roles", filter: "no-match", clear: "empty state" },
    ];

    for (const row of clearRows) {
      test(`ROL-LIST-04 ${row.option}, filter "${row.filter || "(empty)"}", "Clear all filters" in the ${row.clear}`, async ({
        rolesPage,
      }) => {
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
        await expect(rolesPage.list.clearAllFiltersInToolbar()).toHaveCount(0);
      });
    }

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

    for (const kind of ["user", "group"] as const) {
      test(`ROL-LOCK-02 a locked role can be added to a ${kind}`, async ({
        page,
        api,
        cleanup,
        toasts,
      }) => {
        const owner = await seedOwner({ api, cleanup, kind });
        const tab = await openRolesTab({ page, api, kind, owner });
        const modal = await tab.openAdd();
        await modal.table.filter("Role", LOCKED_ROLE);
        const checkbox = modal.table.rows
          .filter({
            has: page.getByRole("gridcell", { name: LOCKED_ROLE, exact: true }),
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

  test.describe("Create", () => {
    test("ROL-CRE-01 form", async ({ rolesPage }) => {
      await rolesPage.goto();
      const modal = await rolesPage.openCreate();
      await expect(modal.field("Name")).toHaveJSProperty("required", true);
      await expect(modal.field("Description")).toBeVisible();
      const tags = new PermissionTags(modal.dialog);
      await expect(tags.input).toHaveAttribute(
        "placeholder",
        "Type a permission (e.g. core.view_task) and press Enter",
      );
    });

    const nameRows: {
      label: string;
      name: (existing: string) => string;
      seed?: boolean;
      outcome:
        | { kind: "created"; plugin?: string }
        | { kind: "required" }
        | { kind: "error"; text: string };
    }[] = [
      { label: "(empty)", name: () => "", outcome: { kind: "required" } },
      {
        label: "only spaces",
        name: () => "   ",
        outcome: { kind: "error", text: "This field may not be blank." },
      },
      {
        label: "custom.reader (with a plugin prefix)",
        name: () => roleName((u) => `custom.${u}`),
        outcome: { kind: "created", plugin: "custom" },
      },
      {
        label: "reader (no dot)",
        name: () => roleName((u) => u),
        outcome: { kind: "created", plugin: "other" },
      },
      {
        label: "an existing custom role's name",
        name: (existing) => existing,
        seed: true,
        outcome: { kind: "error", text: "This field must be unique." },
      },
      {
        label: `a locked role's name (${LOCKED_ROLE})`,
        name: () => LOCKED_ROLE,
        outcome: { kind: "error", text: "This field must be unique." },
      },
      {
        label: "with symbols (custom.read-only_v2)",
        name: () => roleName((u) => `custom.read-only_v2-${u}`),
        outcome: { kind: "created", plugin: "custom" },
      },
      {
        label: "very long (1000 characters)",
        name: () => roleName((u) => `${u}${"x".repeat(1000 - u.length)}`),
        outcome: { kind: "created", plugin: "other" },
      },
    ];

    for (const row of nameRows) {
      test(`ROL-CRE-02 name ${row.label}`, async ({
        rolesPage,
        api,
        cleanup,
        page,
        toasts,
      }) => {
        const existing = cleanup.role(roleName((u) => `custom.${u}`));
        if (row.seed) await api.createRole({ name: existing });
        const name = row.name(existing);
        if (row.outcome.kind === "created") cleanup.role(name);

        await rolesPage.goto();
        const modal = await rolesPage.openCreate();
        const posts: string[] = [];
        page.on("request", (request) => {
          if (
            request.method() === "POST" &&
            request.url().includes("/roles/")
          ) {
            posts.push(request.url());
          }
        });
        await modal.field("Name").fill(name);
        await modal.button("Create").click();

        if (row.outcome.kind === "required") {
          await expect(
            modal.dialog.getByText("Name is required"),
          ).toBeVisible();
          await expect(modal.dialog).toBeVisible();
          expect(posts).toEqual([]);
        } else if (row.outcome.kind === "error") {
          await modal.expectSubmitError(row.outcome.text);
          await expect(modal.dialog).toBeVisible();
        } else {
          await modal.expectClosed();
          await expect(toasts.success(`Role "${name}" created`)).toBeVisible();
          await expect
            .poll(async () => (await api.role(name))?.name)
            .toBe(name);
          if (name.length < 200) {
            await rolesPage.filterBy("Name", name);
            await expect(
              rolesPage.exactRow(name).getByRole("gridcell").nth(PLUGIN),
            ).toHaveText(row.outcome.plugin ?? "");
          }
        }
      });
    }

    for (const row of [
      { label: "(empty)", description: "", cell: "—" },
      {
        label: "one line",
        description: "Reads every task",
        cell: "Reads every task",
      },
      {
        label: "500 characters",
        description: "d".repeat(500),
        cell: "truncated",
      },
    ]) {
      test(`ROL-CRE-03 description ${row.label}`, async ({
        rolesPage,
        cleanup,
      }) => {
        const name = cleanup.role(roleName((u) => `custom.${u}`));
        await rolesPage.goto();
        await rolesPage.create({
          name,
          description: row.description || undefined,
        });
        await rolesPage.filterBy("Name", name);
        const cell = rolesPage
          .exactRow(name)
          .getByRole("gridcell")
          .nth(DESCRIPTION);
        if (row.cell === "truncated") {
          await expect
            .poll(() => cell.evaluate((td) => td.scrollWidth > td.clientWidth))
            .toBe(true);
        } else {
          await expect(cell).toHaveText(row.cell);
        }
      });
    }

    const permissionRows: {
      label: string;
      permissions: string[];
      outcome: { count: number } | { error: string };
    }[] = [
      { label: "none", permissions: [], outcome: { count: 0 } },
      { label: VIEW_TASK, permissions: [VIEW_TASK], outcome: { count: 1 } },
      {
        label: `${VIEW_TASK}, ${CHANGE_TASK}`,
        permissions: [VIEW_TASK, CHANGE_TASK],
        outcome: { count: 2 },
      },
      {
        label: "core.not_a_permission",
        permissions: ["core.not_a_permission"],
        outcome: {
          error: "Permission 'core.not_a_permission' does not exist.",
        },
      },
      {
        label: `${VIEW_TASK}, core.not_a_permission`,
        permissions: [VIEW_TASK, "core.not_a_permission"],
        outcome: {
          error: "Permission 'core.not_a_permission' does not exist.",
        },
      },
      {
        label: "not-a-codename (no dot)",
        permissions: ["not-a-codename"],
        outcome: {
          error:
            "Permission 'not-a-codename' is not in the format '<app_label>.<codename>'.",
        },
      },
    ];

    for (const row of permissionRows) {
      test(`ROL-CRE-04 permissions ${row.label}`, async ({
        rolesPage,
        api,
        cleanup,
      }) => {
        const name = cleanup.role(roleName((u) => `custom.${u}`));
        await rolesPage.goto();
        const modal = await rolesPage.openCreate();
        await modal.field("Name").fill(name);
        await new PermissionTags(modal.dialog).add(...row.permissions);
        await modal.button("Create").click();
        if ("error" in row.outcome) {
          await modal.expectSubmitError(row.outcome.error);
          expect(await api.role(name)).toBeUndefined();
        } else {
          await modal.expectClosed();
          await rolesPage.filterBy("Name", name);
          await expect(
            rolesPage.exactRow(name).getByRole("gridcell").nth(PERMISSIONS),
          ).toHaveText(String(row.outcome.count));
        }
      });
    }

    test("ROL-CRE-05 the new role appears", async ({
      rolesPage,
      cleanup,
      toasts,
    }) => {
      const name = cleanup.role(roleName((u) => `custom.${u}`));
      await rolesPage.goto();
      await rolesPage.create({ name });
      await expect(toasts.success(`Role "${name}" created`)).toBeVisible();
      await rolesPage.filterBy("Name", name);
      await expect(
        rolesPage.exactRow(name).getByRole("gridcell").nth(LOCKED),
      ).toHaveText("No");
    });
  });

  test.describe("Permission input", () => {
    const openTags = async (rolesPage: RolesPage) => {
      await rolesPage.goto();
      const modal = await rolesPage.openCreate();
      return { modal, tags: new PermissionTags(modal.dialog) };
    };

    test(`ROL-PERM-01 type ${VIEW_TASK} and press Enter → one tag, not submitted`, async ({
      rolesPage,
    }) => {
      const { modal, tags } = await openTags(rolesPage);
      await modal.field("Name").fill(uniqueName("role"));
      await tags.add(VIEW_TASK);
      await expect.poll(() => tags.visible()).toEqual([VIEW_TASK]);
      await expect(modal.dialog).toBeVisible();
    });

    for (const row of [
      {
        label: "press Enter with the input empty",
        typed: [""],
        tags: [] as string[],
      },
      { label: "type only spaces and press Enter", typed: ["   "], tags: [] },
      {
        label: `type "  ${VIEW_TASK}  " and press Enter`,
        typed: [`  ${VIEW_TASK}  `],
        tags: [VIEW_TASK],
      },
      {
        label: `add ${VIEW_TASK} twice`,
        typed: [VIEW_TASK, VIEW_TASK],
        tags: [VIEW_TASK],
      },
      {
        label: `add ${VIEW_TASK}, then " ${VIEW_TASK}"`,
        typed: [VIEW_TASK, ` ${VIEW_TASK}`],
        tags: [VIEW_TASK],
      },
      {
        label: "add b.x, a.x, c.x",
        typed: ["b.x", "a.x", "c.x"],
        tags: ["a.x", "b.x", "c.x"],
      },
    ]) {
      test(`ROL-PERM-01 ${row.label}`, async ({ rolesPage }) => {
        const { tags } = await openTags(rolesPage);
        await tags.add(...row.typed);
        await expect.poll(() => tags.visible()).toEqual(row.tags);
        await expect(tags.input).toHaveValue("");
      });
    }

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

    test(`ROL-PERM-01 type ${VIEW_TASK} without pressing Enter, then submit`, async () => {
      test.fixme(
        true,
        "Open: the typed text is not added on submit; decide if it should be",
      );
    });

    for (const row of [
      { label: "click × on b.x", action: "remove b.x", tags: ["a.x", "c.x"] },
      {
        label: "Backspace with the input empty",
        action: "backspace 1",
        tags: ["a.x", "b.x"],
      },
      {
        label: "Backspace three times with the input empty",
        action: "backspace 3",
        tags: [] as string[],
      },
      {
        label: "Backspace with text in the input",
        action: "backspace text",
        tags: ["a.x", "b.x", "c.x"],
      },
    ]) {
      test(`ROL-PERM-02 ${row.label}`, async ({ rolesPage }) => {
        const { tags } = await openTags(rolesPage);
        await tags.add("a.x", "b.x", "c.x");
        await expect.poll(() => tags.visible()).toEqual(["a.x", "b.x", "c.x"]);
        if (row.action === "remove b.x") {
          await tags.removeButton("b.x").click();
        } else if (row.action === "backspace text") {
          await tags.input.fill("d.x");
          await tags.input.press("Backspace");
          await expect(tags.input).toHaveValue("d.");
        } else {
          const times = row.action === "backspace 3" ? 3 : 1;
          for (let i = 0; i < times; i++) await tags.input.press("Backspace");
        }
        await expect.poll(() => tags.visible()).toEqual(row.tags);
      });
    }

    test("ROL-PERM-02 Backspace with the input empty and no tags", async ({
      rolesPage,
    }) => {
      const { modal, tags } = await openTags(rolesPage);
      await tags.input.press("Backspace");
      await expect.poll(() => tags.visible()).toEqual([]);
      await expect(modal.dialog).toBeVisible();
    });

    for (const row of [
      { n: 0, shown: 0, more: null },
      { n: 1, shown: 1, more: null },
      { n: 10, shown: 10, more: null },
      { n: 11, shown: 10, more: "1 more" },
      { n: 15, shown: 10, more: "5 more" },
    ]) {
      test(`ROL-PERM-03 ${row.n} permissions fold to ${row.shown} tags${row.more ? ` and "${row.more}"` : ""}`, async ({
        rolesPage,
      }) => {
        const { tags } = await openTags(rolesPage);
        const permissions = Array.from(
          { length: row.n },
          (_, i) => `p.x${String(i).padStart(2, "0")}`,
        );
        await tags.add(...permissions);
        await expect
          .poll(async () => (await tags.visible()).length)
          .toBe(row.shown);
        if (row.more) {
          await tags.overflow(row.more).click();
          await expect.poll(() => tags.visible()).toEqual(permissions);
          await expect(tags.overflow(/show less/i)).toBeVisible();
        } else {
          await expect(tags.overflow(/\d+ more/)).toHaveCount(0);
        }
      });
    }
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

    test("ROL-EDT-01 form", async ({ rolesPage, api, cleanup }) => {
      const name = await seedRole(api, cleanup);
      await findRole(rolesPage, name);
      const modal = await rolesPage.openEdit(name);
      await expect(modal.field("Name")).toHaveValue(name);
      await expect(modal.field("Name")).toBeDisabled();
      await expect(modal.field("Description")).toHaveValue("Before");
      await expect
        .poll(() => new PermissionTags(modal.dialog).visible())
        .toEqual([CHANGE_TASK, VIEW_TASK]);
    });

    const editRows: {
      description: "keep" | "change";
      add: boolean;
      remove: "nothing" | "a" | "both";
    }[] = [
      { description: "keep", add: false, remove: "nothing" },
      { description: "keep", add: false, remove: "a" },
      { description: "keep", add: true, remove: "nothing" },
      { description: "keep", add: true, remove: "a" },
      { description: "change", add: false, remove: "nothing" },
      { description: "change", add: false, remove: "a" },
      { description: "change", add: true, remove: "nothing" },
      { description: "change", add: true, remove: "a" },
      { description: "keep", add: false, remove: "both" },
    ];

    for (const row of editRows) {
      test(`ROL-EDT-02 ${row.description} the description, add ${row.add ? "c.x" : "nothing"}, remove ${row.remove === "a" ? "a.x" : row.remove}`, async ({
        rolesPage,
        api,
        cleanup,
        toasts,
      }) => {
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
        if (row.remove === "both") await tags.removeButton(CHANGE_TASK).click();
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

    test("ROL-EDT-03 clearing the description", async ({
      rolesPage,
      api,
      cleanup,
    }) => {
      const name = await seedRole(api, cleanup);
      await findRole(rolesPage, name);
      const modal = await rolesPage.openEdit(name);
      await modal.field("Description").fill("");
      await modal.button("Save").click();
      await modal.expectClosed();
      await expect.poll(() => api.roleDescription(name)).toBeNull();
      await expect(
        rolesPage.exactRow(name).getByRole("gridcell").nth(DESCRIPTION),
      ).toHaveText("—");
    });

    test("ROL-EDT-04 invalid permission on edit", async ({
      rolesPage,
      api,
      cleanup,
    }) => {
      const name = await seedRole(api, cleanup);
      await findRole(rolesPage, name);
      const modal = await rolesPage.openEdit(name);
      await new PermissionTags(modal.dialog).add("core.not_a_permission");
      await modal.button("Save").click();
      await modal.expectSubmitError(
        "Permission 'core.not_a_permission' does not exist.",
      );
      expect((await api.role(name))?.permissions.sort()).toEqual(
        [VIEW_TASK, CHANGE_TASK].sort(),
      );
    });

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
    for (const assigned of [
      "not assigned to anyone",
      "assigned to a user",
      "assigned to a group",
      "assigned on one object only",
    ] as const) {
      test(`ROL-DEL-01 delete a role ${assigned}`, async ({
        rolesPage,
        api,
        cleanup,
        page,
        toasts,
      }) => {
        const name = cleanup.role(roleName((u) => `file.${u}`));
        await api.createRole({
          name,
          permissions: ["file.view_filerepository"],
        });
        let owner: { kind: RoleOwnerKind; name: string } | undefined;
        if (
          assigned === "assigned to a user" ||
          assigned === "assigned on one object only"
        ) {
          owner = {
            kind: "user",
            name: await seedOwner({ api, cleanup, kind: "user" }),
          };
        } else if (assigned === "assigned to a group") {
          owner = {
            kind: "group",
            name: await seedOwner({ api, cleanup, kind: "group" }),
          };
        }
        if (owner) {
          let contentObject: string | null = null;
          if (assigned === "assigned on one object only") {
            const repo = cleanup.repository(uniqueName("repo"));
            contentObject = (await api.createFileRepository(repo)).pulp_href;
          }
          await api.assignRole(ownerRef(owner.kind, owner.name), {
            role: name,
            contentObject,
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

  test.describe("Role assignments", () => {
    for (const kind of ["user", "group"] as const) {
      for (const scope of [
        "globally",
        "on one repository",
        "in one domain",
      ] as const) {
        test(`ROLE-ASSIGN-01 ${kind} has a role assigned ${scope}`, async ({
          page,
          api,
          cleanup,
        }) => {
          if (scope === "in one domain") {
            test.skip(
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

      test(`ROLE-ASSIGN-01 ${kind} row shows the assignment's scope`, async () => {
        test.fixme(
          true,
          "Open: Pulp returns each assignment's object or domain but the row hides it; decide whether to show the scope",
        );
      });

      for (const n of [1, 2]) {
        test(`ROLE-ASSIGN-02 add ${n} role(s) to a ${kind}`, async ({
          page,
          api,
          cleanup,
          toasts,
        }) => {
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

      test(`ROLE-ASSIGN-03 remove one assignment of a role a ${kind} holds twice`, async ({
        page,
        api,
        cleanup,
      }) => {
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

    const effectRows: {
      how: string;
      through: "direct" | "group";
      scope: "global" | "object";
    }[] = [
      { how: "directly, globally", through: "direct", scope: "global" },
      {
        how: "through a group they belong to, globally",
        through: "group",
        scope: "global",
      },
      {
        how: "directly, on one repository only",
        through: "direct",
        scope: "object",
      },
      {
        how: "through a group they belong to, on one repository",
        through: "group",
        scope: "object",
      },
    ];

    for (const row of effectRows) {
      test(`ROLE-ASSIGN-05 a role granted ${row.how} takes effect`, async ({
        api,
        cleanup,
        secondUser,
      }) => {
        test.slow();
        test.fail(
          row.scope === "global",
          "UI gap: my_permissions/ leaves out global roles and Pulp exposes them to no non-superuser endpoint",
        );
        const user = await secondUser.create();
        // Two repositories they can see but not change; the role targets the first.
        const target = cleanup.repository(uniqueName("repo"));
        const other = cleanup.repository(uniqueName("repo"));
        const targetHref = (await api.createFileRepository(target)).pulp_href;
        const otherHref = (await api.createFileRepository(other)).pulp_href;
        for (const href of [targetHref, otherHref]) {
          await api.assignRole(
            { user: user.username },
            {
              role: "file.filerepository_viewer",
              contentObject: href,
            },
          );
        }
        let holder: { user: string } | { group: string } = {
          user: user.username,
        };
        if (row.through === "group") {
          const group = cleanup.group(uniqueName("group"));
          await api.createGroup(group);
          await api.addGroupMember(group, user.username);
          holder = { group };
        }

        const page = await secondUser.login(user);
        const repositories = new DataTable(
          page.getByRole("main"),
          "Repositories table",
        );
        const editState = async (repo: string) => {
          await page.goto("/content-management/default/repositories");
          // The repository list probes each row's tasks and permissions: slow.
          await expect(repositories.rows.first()).not.toHaveText(/^\s*$/, {
            timeout: 20_000,
          });
          await repositories.filter("Name", repo);
          // Wait for the filtered page, so the menu isn't re-rendered away.
          await expect(repositories.rows).toHaveCount(1);
          await repositories
            .row(repo)
            .getByRole("button", { name: "Kebab toggle" })
            .click();
          const edit = page.getByRole("menuitem", {
            name: "Edit",
            exact: true,
          });
          await expect(edit).toBeVisible();
          return edit;
        };

        await expect(await editState(target)).toHaveAttribute(
          "aria-disabled",
          "true",
        );

        const assignment = await api.assignRole(holder, {
          role: "file.filerepository_owner",
          contentObject: row.scope === "object" ? targetHref : null,
        });
        await expect(await editState(target)).not.toHaveAttribute(
          "aria-disabled",
          "true",
        );
        if (row.scope === "object") {
          await expect(await editState(other)).toHaveAttribute(
            "aria-disabled",
            "true",
          );
        }

        await api.removeRoleAssignment(assignment.pulp_href);
        await expect(await editState(target)).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      });
    }
  });
});
