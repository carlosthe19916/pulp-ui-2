import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import type { Cleanup } from "./helpers/cleanup";
import { delayApi } from "./helpers/delayApi";
import type { PulpApi } from "./helpers/pulp-api";
import { uniqueName } from "./helpers/unique";
import { BatchAddModal } from "./pom/BatchAddModal";
import type { Toasts } from "./pom/Toasts";

/**
 * Scenarios of e2e/specs/shared/batch-add-modal.md, run on every "Add" modal.
 * Seeded names share a per-test token, so filtering a modal by it isolates the
 * test's own rows from the shared backend.
 */

// Seeding up to a dozen records and deleting them in teardown takes a while on a
// shared backend.
test.describe.configure({ timeout: 120_000 });

interface ICtx {
  api: PulpApi;
  cleanup: Cleanup;
}

interface IModal {
  name: string;
  title: string;
  grid: string;
  /** Text filter title in the modal. */
  filter: string;
  /** Default sort column of the modal table. */
  sortColumn: string;
  item: "group" | "user" | "role";
  owner: "user" | "group";
  /** The owner tab hosting the modal, e.g. "Groups" for "Groups (n)". */
  tab: string;
  tabTable: string;
  addButton: string;
  seedItem: (ctx: ICtx, name: string) => Promise<void>;
  /** Give the owner the item already (membership or global role). */
  attach: (ctx: ICtx, owner: string, item: string) => Promise<void>;
  /** Make adding this item fail, as in the BATCH-07 trigger table. */
  breakItem: (ctx: ICtx, owner: string, item: string) => Promise<void>;
  /** Server reason shown for a broken item. */
  reason: (owner: string, item: string) => string;
  /** Make adding every item fail; returns a function that removes the cause. */
  breakAll: (
    ctx: ICtx,
    owner: string,
    items: string[],
  ) => Promise<() => Promise<void>>;
}

const seedUser = async ({ api, cleanup }: ICtx, name: string) => {
  await api.createUser({ username: cleanup.user(name) });
};
const seedGroup = async ({ api, cleanup }: ICtx, name: string) => {
  await api.createGroup(cleanup.group(name));
};
const seedRole = async ({ api, cleanup }: ICtx, name: string) => {
  await api.createRole({ name: cleanup.role(name) });
};

const roleModal = (owner: "user" | "group"): IModal => {
  const ownerRef = (name: string) =>
    owner === "user" ? { user: name } : { group: name };
  return {
    name: `Add role to ${owner}`,
    title: `Add Role to ${owner === "user" ? "User" : "Group"}`,
    grid: "Select roles",
    filter: "Role",
    sortColumn: "Role",
    item: "role",
    owner,
    tab: "Roles",
    tabTable: owner === "user" ? "User roles table" : "Group roles table",
    addButton: "Add Role",
    seedItem: seedRole,
    attach: async ({ api }, ownerName, role) => {
      await api.assignRole(ownerRef(ownerName), { role });
    },
    breakItem: async ({ api }, ownerName, role) => {
      await api.assignRole(ownerRef(ownerName), { role });
    },
    reason: () => `The role is already assigned to this ${owner}.`,
    breakAll: async ({ api }, ownerName, roles) => {
      const assignments = await Promise.all(
        roles.map((role) => api.assignRole(ownerRef(ownerName), { role })),
      );
      return async () => {
        for (const { pulp_href } of assignments) {
          await api.removeRoleAssignment(pulp_href);
        }
      };
    },
  };
};

const MODALS: IModal[] = [
  {
    name: "Add group to user",
    title: "Add User to Group",
    grid: "Select groups",
    filter: "Name",
    sortColumn: "Name",
    item: "group",
    owner: "user",
    tab: "Groups",
    tabTable: "User groups table",
    addButton: "Add Group",
    seedItem: seedGroup,
    attach: ({ api }, owner, group) => api.addGroupMember(group, owner),
    breakItem: ({ api }, _owner, group) => api.deleteGroup(group),
    reason: () => "No Group matches the given query.",
    // A deleted group can't come back with the same href, so fail every row by
    // deleting the user and fix it by recreating them (adds go by username).
    breakAll: async ({ api }, owner) => {
      await api.deleteUser(owner);
      return async () => {
        await api.createUser({ username: owner });
      };
    },
  },
  {
    name: "Add user to group",
    title: "Add User to Group",
    grid: "Select users",
    filter: "Username",
    sortColumn: "Username",
    item: "user",
    owner: "group",
    tab: "Users",
    tabTable: "Group users table",
    addButton: "Add User",
    seedItem: seedUser,
    attach: ({ api }, owner, username) => api.addGroupMember(owner, username),
    breakItem: ({ api }, _owner, username) => api.deleteUser(username),
    reason: (_owner, username) => `Could not find user ${username}`,
    breakAll: async ({ api }, _owner, usernames) => {
      for (const username of usernames) await api.deleteUser(username);
      return async () => {
        for (const username of usernames) {
          await api.createUser({ username });
        }
      };
    },
  },
  roleModal("user"),
  roleModal("group"),
];

const plural = (count: number, item: string) =>
  `${count} ${item}${count === 1 ? "" : "s"}`;

const target = (modal: IModal, owner: string) => `${modal.owner} "${owner}"`;

/** Seed the owner and `count` items named `<token>-01…`, sorted by name. */
async function seed(
  ctx: ICtx,
  modal: IModal,
  count: number,
): Promise<{ token: string; owner: string; items: string[] }> {
  const token = uniqueName("batch");
  const owner = `${token}-owner`;
  if (modal.owner === "user") await seedUser(ctx, owner);
  else await seedGroup(ctx, owner);
  const items = Array.from(
    { length: count },
    (_, i) => `${token}-${String(i + 1).padStart(2, "0")}`,
  );
  await Promise.all(items.map((item) => modal.seedItem(ctx, item)));
  return { token, owner, items };
}

const tabLocator = (page: Page, modal: IModal) =>
  page.getByRole("tab", { name: new RegExp(`^${modal.tab} \\(\\d+\\)$`) });

/** Open the owner's detail page on the modal's tab. */
async function openOwner(
  page: Page,
  { api }: ICtx,
  modal: IModal,
  owner: string,
): Promise<void> {
  const id =
    modal.owner === "user"
      ? (await api.user(owner))?.id
      : (await api.group(owner))?.id;
  await page.goto(`/admin/${modal.owner}s/${id}`);
  await expect(
    page.getByRole("heading", { level: 1, name: owner, exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await tabLocator(page, modal).click();
}

async function openModal(page: Page, modal: IModal): Promise<BatchAddModal> {
  await page
    .getByRole("button", { name: modal.addButton, exact: true })
    .click();
  const dialog = new BatchAddModal(page, {
    title: modal.title,
    grid: modal.grid,
  });
  await dialog.table.expectLoaded();
  return dialog;
}

async function openFiltered(
  page: Page,
  ctx: ICtx,
  modal: IModal,
  { owner, token }: { owner: string; token: string },
): Promise<BatchAddModal> {
  await openOwner(page, ctx, modal, owner);
  const dialog = await openModal(page, modal);
  await dialog.table.filter(modal.filter, token);
  return dialog;
}

/**
 * Re-apply a filter value the modal has already fetched: the cached page renders
 * without a request, so wait for the expected row instead of a response.
 */
async function refilter(
  dialog: BatchAddModal,
  {
    filter,
    value,
    expectRow,
  }: { filter: string; value: string; expectRow: string },
): Promise<void> {
  await dialog.table.filterInput(filter).fill(value);
  await expect(dialog.table.row(expectRow)).toBeVisible();
}

async function expectAddedToasts(
  toasts: Toasts,
  { count, item, to }: { count: number; item: string; to: string },
): Promise<void> {
  await expect(
    toasts.success(`${plural(count, item)} added to ${to}`),
  ).toBeVisible();
}

// Each BATCH scenario is one test that walks the four modals as steps, so a
// scenario ID appears exactly once in a test title. Every modal/row step seeds
// its own owner and items, so the steps are order-independent.

// --- BATCH-01 -------------------------------------------------------------
// Main cases: none, one, and one-then-deselected (not every count).
const batch01 = [
  { n: "0", label: "Add", enabled: false, select: 0, deselect: false },
  { n: "1", label: "Add (1)", enabled: true, select: 1, deselect: false },
  {
    n: "1, then deselect it",
    label: "Add",
    enabled: false,
    select: 1,
    deselect: true,
  },
];

test("BATCH-01 selecting rows drives the Add button", async ({
  page,
  api,
  cleanup,
}) => {
  test.slow();
  const ctx = { api, cleanup };
  for (const modal of MODALS) {
    await test.step(modal.name, async () => {
      for (const row of batch01) {
        await test.step(`select ${row.n} → "${row.label}"`, async () => {
          const seeded = await seed(ctx, modal, 3);
          const dialog = await openFiltered(page, ctx, modal, seeded);
          await expect(dialog.table.rows).toHaveCount(3);
          for (const item of seeded.items.slice(0, row.select)) {
            await dialog.table.selectRow(item).check();
          }
          if (row.deselect) {
            await dialog.table.selectRow(seeded.items[0]).uncheck();
          }
          await expect(dialog.addButton()).toHaveText(row.label);
          if (row.enabled) await expect(dialog.addButton()).toBeEnabled();
          else await expect(dialog.addButton()).toBeDisabled();
        });
      }
    });
  }
});

// --- BATCH-02 -------------------------------------------------------------
test("BATCH-02 selection spans pages", async ({ page, api, cleanup }) => {
  test.slow();
  const ctx = { api, cleanup };
  for (const modal of MODALS) {
    await test.step(modal.name, async () => {
      const seeded = await seed(ctx, modal, 11);
      const dialog = await openFiltered(page, ctx, modal, seeded);
      await dialog.table.selectRow(seeded.items[0]).check();
      await dialog.table.paginator().next().click();
      await expect(dialog.table.row(seeded.items[10])).toBeVisible();
      await dialog.table.selectRow(seeded.items[10]).check();
      await expect(dialog.addButton()).toHaveText("Add (2)");
      await dialog.table.paginator().previous().click();
      await expect(dialog.table.selectRow(seeded.items[0])).toBeChecked();
    });
  }
});

// --- BATCH-03 -------------------------------------------------------------
// Main cases: selection survives a filter that hides it and a sort change.
const batch03 = [
  "filter so the selected row is hidden",
  "change the sort",
] as const;

test("BATCH-03 selection survives filter and sort changes", async ({
  page,
  api,
  cleanup,
}) => {
  test.slow();
  const ctx = { api, cleanup };
  for (const modal of MODALS) {
    await test.step(modal.name, async () => {
      for (const change of batch03) {
        await test.step(change, async () => {
          const seeded = await seed(ctx, modal, 3);
          const [selected, other] = seeded.items;
          const dialog = await openFiltered(page, ctx, modal, seeded);
          await dialog.table.selectRow(selected).check();

          if (change === "filter so the selected row is hidden") {
            await dialog.table.filter(modal.filter, other);
            await expect(dialog.table.row(selected)).toHaveCount(0);
            await expect(dialog.addButton()).toHaveText("Add (1)");
            return;
          }
          await dialog.table.sortBy(modal.sortColumn);
          await dialog.table.expectSorted(modal.sortColumn, "descending");
          await expect(dialog.addButton()).toHaveText("Add (1)");
          await expect(dialog.table.selectRow(selected)).toBeChecked();
        });
      }
    });
  }
});

// --- BATCH-04 -------------------------------------------------------------
test("BATCH-04 the existing item cannot be selected", async ({
  page,
  api,
  cleanup,
}) => {
  test.slow();
  const ctx = { api, cleanup };
  for (const modal of MODALS) {
    await test.step(modal.name, async () => {
      const seeded = await seed(ctx, modal, 11);
      // Sorts after every "-NN" item, so it sits on page 2.
      const existing = `${seeded.token}-zz`;
      await modal.seedItem(ctx, existing);
      await modal.attach(ctx, seeded.owner, existing);

      const dialog = await openFiltered(page, ctx, modal, seeded);
      await dialog.table.paginator().next().click();
      await expect(dialog.table.selectRow(existing)).toBeDisabled();

      await dialog.table.filter(modal.filter, existing);
      await expect(dialog.table.rows).toHaveCount(1);
      await expect(dialog.table.selectRow(existing)).toBeDisabled();

      await refilter(dialog, {
        filter: modal.filter,
        value: seeded.token,
        expectRow: seeded.items[0],
      });
      await dialog.table.sortBy(modal.sortColumn);
      await expect(dialog.table.selectRow(existing)).toBeDisabled();

      // Page 1 sorted descending: the existing item plus the last nine others.
      await dialog.selectPage();
      await expect(dialog.addButton()).toHaveText("Add (9)");
      await expect(dialog.table.selectRow(existing)).not.toBeChecked();
      for (const item of seeded.items.slice(2)) {
        await expect(dialog.table.selectRow(item)).toBeChecked();
      }
    });
  }
});

// --- BATCH-07 -------------------------------------------------------------
// Main outcomes: all succeed, partial success (mixed toasts), and all fail
// (modal stays open) — not every count.
const batch07 = [
  { selection: "1 row, which succeeds", rows: 1, fail: 0 },
  { selection: "2 rows, one fails", rows: 2, fail: 1 },
  { selection: "1 row, which fails", rows: 1, fail: 1 },
];

test("BATCH-07 add results produce the right toasts", async ({
  page,
  api,
  cleanup,
  toasts,
}) => {
  test.slow();
  const ctx = { api, cleanup };
  for (const modal of MODALS) {
    await test.step(modal.name, async () => {
      for (const row of batch07) {
        await test.step(row.selection, async () => {
          const seeded = await seed(ctx, modal, row.rows);
          const dialog = await openFiltered(page, ctx, modal, seeded);
          for (const item of seeded.items) {
            await dialog.table.selectRow(item).check();
          }
          const failing = seeded.items.slice(0, row.fail);
          const passing = seeded.items.slice(row.fail);
          for (const item of failing) {
            await modal.breakItem(ctx, seeded.owner, item);
          }
          await dialog.addButton().click();

          const to = target(modal, seeded.owner);
          if (passing.length > 0) {
            await expectAddedToasts(toasts, {
              count: passing.length,
              item: modal.item,
              to,
            });
          }
          if (failing.length > 0) {
            const title = new RegExp(
              `Failed to add ${plural(failing.length, modal.item)} to ${escapeRe(to)}: `,
            );
            await expect(toasts.danger(title)).toBeVisible();
            const body = toasts.dangerBody(title);
            for (const item of failing) await expect(body).toContainText(item);
            // The first failure's reason; which one is first depends on timing.
            await expect(body).toContainText(
              new RegExp(
                failing
                  .map((item) => escapeRe(modal.reason(seeded.owner, item)))
                  .join("|"),
              ),
            );
          } else {
            await expect(toasts.danger(/Failed to add/)).toHaveCount(0);
          }
          if (passing.length === 0) {
            await expect(toasts.success(/ added to /)).toHaveCount(0);
            await expect(dialog.dialog).toBeVisible();
            await expect(dialog.addButton()).toHaveText(`Add (${row.rows})`);
          } else {
            await expect(dialog.dialog).toBeHidden();
          }
        });
      }
    });
  }
});

// --- BATCH-08 -------------------------------------------------------------
test("BATCH-08 the Add button while saving", async ({ page, api, cleanup }) => {
  test.slow();
  const ctx = { api, cleanup };
  for (const modal of MODALS) {
    await test.step(modal.name, async () => {
      const seeded = await seed(ctx, modal, 2);
      const dialog = await openFiltered(page, ctx, modal, seeded);
      for (const item of seeded.items) {
        await dialog.table.selectRow(item).check();
      }
      const held = await delayApi(page, {
        url: (url) => /\/(users|roles)\/$/.test(url.pathname),
        method: "POST",
      });
      await dialog.addButton().click();
      await expect.poll(held.held).toBe(2);
      await expect(dialog.addButton()).toBeDisabled();
      await expect(dialog.addButton().getByRole("progressbar")).toBeVisible();
      held.release();
      await expect(dialog.dialog).toBeHidden();
    });
  }
});

// --- BATCH-09 -------------------------------------------------------------
test("BATCH-09 retry after a full failure", async ({
  page,
  api,
  cleanup,
  toasts,
}) => {
  test.slow();
  const ctx = { api, cleanup };
  for (const modal of MODALS) {
    await test.step(modal.name, async () => {
      const seeded = await seed(ctx, modal, 2);
      const dialog = await openFiltered(page, ctx, modal, seeded);
      for (const item of seeded.items) {
        await dialog.table.selectRow(item).check();
      }
      const fix = await modal.breakAll(ctx, seeded.owner, seeded.items);
      await dialog.addButton().click();
      await expect(toasts.danger(/Failed to add 2 /)).toBeVisible();
      await expect(dialog.addButton()).toHaveText("Add (2)");

      await fix();
      await dialog.addButton().click();
      await expectAddedToasts(toasts, {
        count: 2,
        item: modal.item,
        to: target(modal, seeded.owner),
      });
      await expect(dialog.dialog).toBeHidden();
    });
  }
});

// --- BATCH-10 -------------------------------------------------------------
test("BATCH-10 the owner tab updates after adding", async ({
  page,
  api,
  cleanup,
}) => {
  test.slow();
  const ctx = { api, cleanup };
  for (const modal of MODALS) {
    await test.step(modal.name, async () => {
      const seeded = await seed(ctx, modal, 3);
      const [existing, ...added] = seeded.items;
      await modal.attach(ctx, seeded.owner, existing);
      await openOwner(page, ctx, modal, seeded.owner);
      await expect(tabLocator(page, modal)).toHaveText(`${modal.tab} (1)`);

      const dialog = await openModal(page, modal);
      await dialog.table.filter(modal.filter, seeded.token);
      for (const item of added) await dialog.table.selectRow(item).check();
      await dialog.addButton().click();
      await expect(dialog.dialog).toBeHidden();

      await expect(tabLocator(page, modal)).toHaveText(`${modal.tab} (3)`);
      const tabTable = page.getByRole("grid", {
        name: modal.tabTable,
        exact: true,
      });
      for (const item of added) {
        await expect(
          tabTable.getByRole("row").filter({ hasText: item }),
        ).toBeVisible();
      }
    });
  }
});

// --- BATCH-11 -------------------------------------------------------------
// One close path is enough here (× / Escape share it); dismissal variants are
// covered generically by the confirm-dialog component test.
test("BATCH-11 closing with Cancel discards the selection", async ({
  page,
  api,
  cleanup,
  toasts,
}) => {
  test.slow();
  const how = "Cancel" as const;
  const ctx = { api, cleanup };
  for (const modal of MODALS) {
    await test.step(modal.name, async () => {
      const seeded = await seed(ctx, modal, 11);
      const dialog = await openFiltered(page, ctx, modal, seeded);
      await dialog.table.sortBy(modal.sortColumn);
      await dialog.table.paginator().next().click();
      await expect(dialog.table.paginator().currentPage()).toHaveValue("2");
      // Sorted descending, page 2 holds the first item.
      await dialog.table.selectRow(seeded.items[0]).check();
      await expect(dialog.addButton()).toHaveText("Add (1)");

      await dialog.close(how);
      await toasts.expectNone();
      // Checked before reopening: an open modal hides the page from the a11y tree.
      await expect(tabLocator(page, modal)).toHaveText(`${modal.tab} (0)`);

      const reopened = await openModal(page, modal);
      await expect(reopened.addButton()).toHaveText("Add");
      await expect(reopened.addButton()).toBeDisabled();
      await expect(reopened.table.filterInput(modal.filter)).toHaveValue("");
      await reopened.table.expectSorted(modal.sortColumn, "ascending");
      await expect(reopened.table.paginator().currentPage()).toHaveValue("1");
    });
  }
});

// --- BATCH-05 -------------------------------------------------------------

const batch05 = [
  { scope: "globally", selectable: false },
  { scope: "only on one object", selectable: true },
  { scope: "only in one domain", selectable: true },
  { scope: "globally and on one object", selectable: false },
  { scope: "not at all", selectable: true },
] as const;

test("BATCH-05 role selectability by existing assignment scope", async ({
  page,
  api,
  cleanup,
  toasts,
}) => {
  test.slow();
  const ctx = { api, cleanup };
  for (const owner of ["user", "group"] as const) {
    const modal = roleModal(owner);
    await test.step(modal.name, async () => {
      for (const row of batch05) {
        const label = `role assigned ${row.scope} → ${
          row.selectable ? "selectable" : "not selectable"
        }`;
        await test.step(label, async (step) => {
          if (row.scope === "only in one domain") {
            step.skip(
              !api.domainEnabled,
              "domains are disabled on this backend",
            );
          }
          const token = uniqueName("batch");
          const ownerName = `${token}-owner`;
          const ownerRef =
            owner === "user" ? { user: ownerName } : { group: ownerName };
          if (owner === "user") await seedUser(ctx, ownerName);
          else await seedGroup(ctx, ownerName);
          // Object and domain scopes need a permission on the object's model.
          const role = cleanup.role(`${token}-role`);
          await api.createRole({
            name: role,
            permissions: ["file.view_filerepository"],
          });
          const repository = cleanup.repository(`${token}-repo`);
          const { pulp_href: repositoryHref } =
            await api.createFileRepository(repository);

          if (row.scope.includes("globally")) {
            await api.assignRole(ownerRef, { role });
          }
          if (row.scope.includes("object")) {
            await api.assignRole(ownerRef, {
              role,
              contentObject: repositoryHref,
            });
          }
          if (row.scope.includes("domain")) {
            await api.assignRole(ownerRef, {
              role,
              domain: await api.defaultDomainHref(),
            });
          }

          await openOwner(page, ctx, modal, ownerName);
          const dialog = await openModal(page, modal);
          await dialog.table.filter(modal.filter, role);
          const checkbox = dialog.table.selectRow(role);
          if (!row.selectable) {
            await expect(checkbox).toBeDisabled();
            return;
          }
          await expect(checkbox).toBeEnabled();
          await checkbox.check();
          await dialog.addButton().click();
          await expect(
            toasts.success(`1 role added to ${owner} "${ownerName}"`),
          ).toBeVisible();
          // The add is global, so it shows next to any scoped assignment.
          const scoped = row.scope === "not at all" ? 0 : 1;
          await expect(
            page
              .getByRole("grid", { name: modal.tabTable, exact: true })
              .getByRole("row")
              .filter({ hasText: role }),
          ).toHaveCount(scoped + 1);
          const global = (await api.roleAssignments(ownerRef)).filter(
            (a) => a.role === role && !a.content_object && !a.domain,
          );
          expect(global).toHaveLength(1);
        });
      }
    });
  }
});

// --- BATCH-06 -------------------------------------------------------------

test("BATCH-06 membership through another route does not block", async ({
  page,
  api,
  cleanup,
}) => {
  const ctx = { api, cleanup };
  const token = uniqueName("batch");
  const user = `${token}-u`;
  const [g1, g2] = [`${token}-g1`, `${token}-g2`];
  await seedUser(ctx, user);
  await seedGroup(ctx, g1);
  await seedGroup(ctx, g2);
  await api.addGroupMember(g1, user);

  const [groupToUser, userToGroup] = MODALS;
  await openOwner(page, ctx, groupToUser, user);
  const groups = await openModal(page, groupToUser);
  await groups.table.filter("Name", token);
  await expect(groups.table.selectRow(g1)).toBeDisabled();
  await expect(groups.table.selectRow(g2)).toBeEnabled();
  await groups.close("Cancel");

  await openOwner(page, ctx, userToGroup, g2);
  const users = await openModal(page, userToGroup);
  await users.table.filter("Username", user);
  await expect(users.table.selectRow(user)).toBeEnabled();
});

const escapeRe = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
