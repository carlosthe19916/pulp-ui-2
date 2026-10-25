import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { delayApi } from "./helpers/delayApi";
import type { IGroupRecord, IUserRecord, PulpApi } from "./helpers/pulp-api";
import { uniqueName } from "./helpers/unique";
import { DataTable } from "./pom/DataTable";

/**
 * e2e/specs/shared/data-list.md: filter, sort, paging and body states of every admin
 * table. Each worker seeds its own rows (names carry a worker token) in `beforeAll`;
 * tables that also list other data are scoped to those rows with the token filter.
 */

// --- Seed ---------------------------------------------------------------------

// With SPECIALS, 21 rows per kind: more than two 10-row pages and more than 20 rows.
const LETTERS = "abcdefghijklmnopq".split("");
/** Rows for the text-filter classes of LIST-07 (`%`, `_`, unicode). */
const SPECIALS = ["pct%x", "und_x", "ñandú", "日本"];

interface ISeed {
  token: string;
  users: string[];
  groups: string[];
  roles: string[];
  ownerUser: IUserRecord;
  ownerGroup: IGroupRecord;
  groupIds: number[];
}

let seed: ISeed;

const name = (kind: "u" | "g" | "r", suffix: string) =>
  `e2e-ls${seed.token}-${kind}-${suffix}`;

async function inChunks<T>(
  items: T[],
  run: (item: T) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < items.length; i += 8) {
    await Promise.all(items.slice(i, i + 8).map(run));
  }
}

async function createSeed(api: PulpApi): Promise<ISeed> {
  const token = uniqueName("x").slice(-6);
  seed = { token } as ISeed;
  // Created in reverse, so creation order (dates) differs from name order.
  const suffixes = [...LETTERS].reverse().concat(SPECIALS);
  const users = suffixes.map((s) => name("u", s));
  const groups = suffixes.map((s) => name("g", s));
  const roles = suffixes.map((s) => name("r", s));
  // Emails sort opposite to usernames; every value is unique.
  await inChunks([...users.entries()], ([i, username]) =>
    api.createUser({
      username,
      email: `${String(i).padStart(2, "0")}.${token}@example.com`,
    }),
  );
  const groupRecords: IGroupRecord[] = [];
  await inChunks(groups, async (group) =>
    groupRecords.push(await api.createGroup(group)),
  );
  await inChunks([...roles.entries()], ([i, role]) =>
    api.createRole({
      name: role,
      description: `${token} d ${String(99 - i).padStart(2, "0")}`,
    }),
  );
  const ownerUser = await api.createUser({
    username: `e2e-ls${token}-owner`,
    email: `owner.${token}@example.com`,
  });
  const ownerGroup = await api.createGroup(`e2e-ls${token}-owner`);
  await inChunks(groups, (group) =>
    api.addGroupMember(group, ownerUser.username),
  );
  await inChunks(users, (user) => api.addGroupMember(ownerGroup.name, user));
  // Sequential per owner, so each assignment has its own Created time.
  await Promise.all([
    (async () => {
      for (const role of roles) {
        await api.assignRole({ user: ownerUser.username }, { role });
      }
    })(),
    (async () => {
      for (const role of roles) {
        await api.assignRole({ group: ownerGroup.name }, { role });
      }
    })(),
  ]);
  seed = {
    token,
    users,
    groups,
    roles,
    ownerUser,
    ownerGroup,
    groupIds: groupRecords.map((g) => g.id),
  };
  return seed;
}

async function deleteSeed(api: PulpApi): Promise<void> {
  if (!seed?.users) return;
  await inChunks([...seed.users, seed.ownerUser.username], (u) =>
    api.deleteUser(u),
  );
  await inChunks([...seed.groups, seed.ownerGroup.name], (g) =>
    api.deleteGroup(g),
  );
  await inChunks(seed.roles, (r) => api.deleteRole(r));
}

// --- Table descriptors ----------------------------------------------------------

type TableName =
  | "Users"
  | "Groups"
  | "Roles"
  | "Access policies"
  | "User groups"
  | "User roles"
  | "Group users"
  | "Group roles"
  | "Select groups"
  | "Select users"
  | "Select roles (user)"
  | "Select roles (group)";

interface ISortColumn {
  column: string;
  /** The `ordering` key, compared against the API's order of the name column. */
  key: string;
  /** Low-cardinality columns: check the shown values are ordered by this rank instead. */
  rank?: string[];
}

interface ITable {
  name: TableName;
  grid: string;
  /** Navigate to where the table lives, short of the step that loads it. */
  prepare: (page: Page) => Promise<void>;
  /** The step that loads the table (navigate, click the tab, open the modal). */
  reveal: (page: Page) => Promise<void>;
  scope: (page: Page) => Locator;
  /** The request that loads the rows (held by LIST-13). */
  request: (url: URL) => boolean;
  headers: string[];
  /** The column holding each row's name. */
  nameColumn: string;
  filter?: { title: string };
  sort: ISortColumn[]; // default first
  pageSize: 10 | 20;
  filteredEmpty?: string;
  /** API collection listing the same rows, its name field and filter param. */
  api: {
    path: (api: PulpApi) => string;
    nameField: string;
    filterParam?: string;
    params?: () => Record<string, string>;
  };
  /** A filter that keeps only stable rows (this worker's seeds) for tables with other data. */
  scopeFilter?: () => string;
  /** Its unfiltered rows don't change during a run (paging needs no scope). */
  stable?: boolean;
  /** LIST-07 values: one full row value, a substring matching several rows, one character. */
  values?: () => { full: string; middle: string; single: string };
}

const v3 = (api: PulpApi, path: string) =>
  `/api/pulp${api.domainEnabled ? "/default" : ""}/api/v3/${path}`;

const gotoHeading = async (page: Page, path: string, heading: string) => {
  await page.goto(path);
  await expect(
    page.getByRole("heading", { level: 1, name: heading, exact: true }),
  ).toBeVisible();
};

const userPage = (page: Page) =>
  gotoHeading(
    page,
    `/admin/users/${seed.ownerUser.id}`,
    seed.ownerUser.username,
  );
const groupPage = (page: Page) =>
  gotoHeading(
    page,
    `/admin/groups/${seed.ownerGroup.id}`,
    seed.ownerGroup.name,
  );
const clickTab = (page: Page, tab: "Groups" | "Roles" | "Users") =>
  page.getByRole("tab", { name: new RegExp(`^${tab} \\(\\d+\\)$`) }).click();
const clickButton = (page: Page, label: string) =>
  page.getByRole("button", { name: label, exact: true }).click();
const dialog = (page: Page, title: string) =>
  page.getByRole("dialog").filter({
    has: page.getByRole("heading", { level: 1, name: title, exact: true }),
  });

const endsWith = (suffix: string) => (url: URL) =>
  url.pathname.endsWith(suffix) && url.searchParams.has("limit");
const nested = (pattern: RegExp) => (url: URL) => pattern.test(url.pathname);

const seededValues = (kind: "u" | "g" | "r") => () => ({
  full: name(kind, "k"),
  middle: `${seed.token}-${kind}-`,
  single: seed.token.slice(-1),
});

const usersApi = {
  path: (api: PulpApi) => v3(api, "users/"),
  nameField: "username",
  filterParam: "username__icontains",
};
const groupsApi = {
  path: (api: PulpApi) => v3(api, "groups/"),
  nameField: "name",
  filterParam: "name__icontains",
};
const rolesApi = {
  path: (api: PulpApi) => v3(api, "roles/"),
  nameField: "name",
  filterParam: "name__icontains",
};
const tokenScope = () => `e2e-ls${seed.token}-`;

const TABLES: ITable[] = [
  {
    name: "Users",
    grid: "Users table",
    prepare: async () => {},
    reveal: (page) => gotoHeading(page, "/admin/users", "Users"),
    scope: (page) => page.getByRole("main"),
    request: endsWith("/users/"),
    headers: [
      "Username",
      "Email",
      "Active",
      "Groups",
      "Date Joined",
      "Actions",
    ],
    nameColumn: "Username",
    filter: { title: "Username" },
    sort: [
      { column: "Username", key: "username" },
      { column: "Date Joined", key: "date_joined" },
    ],
    pageSize: 10,
    filteredEmpty: "No results found",
    api: usersApi,
    scopeFilter: tokenScope,
    values: seededValues("u"),
  },
  {
    name: "Groups",
    grid: "Groups table",
    prepare: async () => {},
    reveal: (page) => gotoHeading(page, "/admin/groups", "Groups"),
    scope: (page) => page.getByRole("main"),
    request: endsWith("/groups/"),
    headers: ["Name", "Actions"],
    nameColumn: "Name",
    filter: { title: "Name" },
    sort: [{ column: "Name", key: "name" }],
    pageSize: 10,
    filteredEmpty: "No results found",
    api: groupsApi,
    scopeFilter: tokenScope,
    values: seededValues("g"),
  },
  {
    name: "Roles",
    grid: "Roles table",
    prepare: async () => {},
    reveal: (page) => gotoHeading(page, "/admin/roles", "Roles"),
    scope: (page) => page.getByRole("main"),
    request: endsWith("/roles/"),
    headers: [
      "Name",
      "Plugin",
      "Description",
      "Permissions",
      "Locked",
      "Actions",
    ],
    nameColumn: "Name",
    filter: { title: "Name" },
    sort: [
      { column: "Name", key: "name" },
      { column: "Locked", key: "locked", rank: ["No", "Yes"] },
    ],
    pageSize: 10,
    filteredEmpty: "No results found",
    api: rolesApi,
    scopeFilter: tokenScope,
    values: seededValues("r"),
  },
  {
    name: "Access policies",
    grid: "Access policies table",
    prepare: async () => {},
    reveal: (page) =>
      gotoHeading(page, "/admin/access-policies", "Access policies"),
    scope: (page) => page.getByRole("main"),
    request: endsWith("/access_policies/"),
    headers: ["Viewset", "Statements", "Status", "Actions"],
    nameColumn: "Viewset",
    filter: { title: "Viewset" },
    sort: [
      { column: "Viewset", key: "viewset_name" },
      { column: "Status", key: "customized", rank: ["Default", "Customized"] },
    ],
    pageSize: 20,
    filteredEmpty: "No results found",
    api: {
      path: (api) => v3(api, "access_policies/"),
      nameField: "viewset_name",
      filterParam: "viewset_name__icontains",
    },
    // Policies can't be seeded; these 25 viewsets are more than one 20-row page.
    scopeFilter: () => "repositories",
    stable: true,
    values: () => ({ full: "tasks", middle: "positories/fi", single: "q" }),
  },
  {
    name: "User groups",
    grid: "User groups table",
    prepare: async () => {},
    reveal: userPage,
    scope: (page) => page.getByRole("tabpanel"),
    request: (url) =>
      url.pathname.endsWith("/groups/") && url.searchParams.has("id__in"),
    headers: ["Name", "Actions"],
    nameColumn: "Name",
    filter: { title: "Name" },
    sort: [{ column: "Name", key: "name" }],
    pageSize: 10,
    filteredEmpty: "No groups match the filter",
    api: {
      ...groupsApi,
      params: () => ({ id__in: seed.groupIds.join(",") }),
    },
    values: seededValues("g"),
  },
  {
    name: "User roles",
    grid: "User roles table",
    prepare: userPage,
    reveal: (page) => clickTab(page, "Roles"),
    scope: (page) => page.getByRole("tabpanel"),
    request: nested(/\/users\/\d+\/roles\/$/),
    headers: ["Role", "Description", "Permissions", "Created", "Actions"],
    nameColumn: "Role",
    filter: { title: "Role" },
    sort: [
      { column: "Role", key: "role" },
      { column: "Description", key: "description" },
      { column: "Created", key: "pulp_created" },
    ],
    pageSize: 10,
    filteredEmpty: "No roles match the filter",
    api: {
      path: () => `${seed.ownerUser.pulp_href}roles/`,
      nameField: "role",
      filterParam: "role__icontains",
    },
    values: seededValues("r"),
  },
  {
    name: "Group users",
    grid: "Group users table",
    prepare: async () => {},
    reveal: groupPage,
    scope: (page) => page.getByRole("tabpanel"),
    request: nested(/\/groups\/\d+\/users\/$/),
    headers: ["Username", "Actions"],
    nameColumn: "Username",
    sort: [],
    pageSize: 10,
    api: {
      path: () => `${seed.ownerGroup.pulp_href}users/`,
      nameField: "username",
    },
  },
  {
    name: "Group roles",
    grid: "Group roles table",
    prepare: groupPage,
    reveal: (page) => clickTab(page, "Roles"),
    scope: (page) => page.getByRole("tabpanel"),
    request: nested(/\/groups\/\d+\/roles\/$/),
    headers: ["Role", "Description", "Permissions", "Created", "Actions"],
    nameColumn: "Role",
    filter: { title: "Role" },
    sort: [
      { column: "Role", key: "role" },
      { column: "Description", key: "description" },
      { column: "Created", key: "pulp_created" },
    ],
    pageSize: 10,
    filteredEmpty: "No roles match the filter",
    api: {
      path: () => `${seed.ownerGroup.pulp_href}roles/`,
      nameField: "role",
      filterParam: "role__icontains",
    },
    values: seededValues("r"),
  },
  {
    name: "Select groups",
    grid: "Select groups",
    prepare: userPage,
    reveal: (page) => clickButton(page, "Add Group"),
    scope: (page) => dialog(page, "Add User to Group"),
    request: (url) =>
      url.pathname.endsWith("/groups/") && !url.searchParams.has("id__in"),
    headers: ["Data selection table head cell", "Name"],
    nameColumn: "Name",
    filter: { title: "Name" },
    sort: [{ column: "Name", key: "name" }],
    pageSize: 10,
    filteredEmpty: "No results found",
    api: groupsApi,
    scopeFilter: tokenScope,
    values: seededValues("g"),
  },
  {
    name: "Select users",
    grid: "Select users",
    prepare: groupPage,
    reveal: (page) => clickButton(page, "Add User"),
    scope: (page) => dialog(page, "Add User to Group"),
    request: endsWith("/users/"),
    headers: ["Data selection table head cell", "Username", "Email", "Name"],
    nameColumn: "Username",
    filter: { title: "Username" },
    sort: [
      { column: "Username", key: "username" },
      { column: "Email", key: "email" },
    ],
    pageSize: 10,
    filteredEmpty: "No results found",
    api: usersApi,
    scopeFilter: tokenScope,
    values: seededValues("u"),
  },
  ...(["user", "group"] as const).map((kind): ITable => ({
    name: kind === "user" ? "Select roles (user)" : "Select roles (group)",
    grid: "Select roles",
    prepare: async (page) => {
      await (kind === "user" ? userPage(page) : groupPage(page));
      await clickTab(page, "Roles");
    },
    reveal: (page) => clickButton(page, "Add Role"),
    scope: (page) =>
      dialog(page, `Add Role to ${kind === "user" ? "User" : "Group"}`),
    request: endsWith("/roles/"),
    headers: [
      "Data selection table head cell",
      "Role",
      "Description",
      "Permissions",
    ],
    nameColumn: "Role",
    filter: { title: "Role" },
    sort: [
      { column: "Role", key: "name" },
      { column: "Description", key: "description" },
    ],
    pageSize: 10,
    filteredEmpty: "No results found",
    api: rolesApi,
    scopeFilter: tokenScope,
    values: seededValues("r"),
  })),
];

const table = (tableName: TableName): ITable => {
  const found = TABLES.find((t) => t.name === tableName);
  if (!found) throw new Error(tableName);
  return found;
};

// --- Helpers ------------------------------------------------------------------

/** Open the table and wait for its rows. */
async function open(page: Page, t: ITable): Promise<DataTable> {
  await t.prepare(page);
  await t.reveal(page);
  const dataTable = new DataTable(t.scope(page), t.grid);
  await dataTable.expectLoaded();
  return dataTable;
}

/** Open the table, narrowed to stable rows when it also lists other data. */
async function openScoped(page: Page, t: ITable): Promise<DataTable> {
  const dataTable = await open(page, t);
  if (t.scopeFilter && t.filter) {
    await dataTable.filter(t.filter.title, t.scopeFilter());
    await dataTable.expectLoaded();
  }
  return dataTable;
}

/** Open for paging: the whole table when its rows are stable, else scoped. */
const openForPaging = (page: Page, t: ITable) =>
  t.stable ? open(page, t) : openScoped(page, t);

/** One page of the same rows from the API: total and names in order. */
async function apiPage(
  api: PulpApi,
  t: ITable,
  {
    filter,
    ordering,
    limit = t.pageSize,
  }: { filter?: string; ordering?: string; limit?: number },
): Promise<{ count: number; names: string[] }> {
  const params: Record<string, string | number> = {
    limit,
    ...(t.api.params?.() ?? {}),
  };
  if (ordering) params.ordering = ordering;
  if (filter && t.api.filterParam) params[t.api.filterParam] = filter;
  const body = await api.getJson<{
    count: number;
    results: Record<string, string>[];
  }>(t.api.path(api), params);
  return {
    count: body.count,
    names: body.results.map((row) => row[t.api.nameField]),
  };
}

/** The shown rows are in the order Pulp gives for that sort. */
async function expectOrder(
  api: PulpApi,
  t: ITable,
  dataTable: DataTable,
  { column, ordering }: { column: ISortColumn; ordering: string },
): Promise<void> {
  await dataTable.expectLoaded();
  if (column.rank) {
    const rank = column.rank;
    const values = await dataTable.columnTexts(column.column);
    const ranks = values.map((value) => rank.indexOf(value));
    const sorted = [...ranks].sort((a, b) =>
      ordering.startsWith("-") ? b - a : a - b,
    );
    expect(ranks).toEqual(sorted);
    return;
  }
  const { names } = await apiPage(api, t, {
    filter: t.scopeFilter?.(),
    ordering,
  });
  await expect.poll(() => dataTable.columnTexts(t.nameColumn)).toEqual(names);
}

/** Every shown row contains the value (case-insensitive), or the filtered empty state shows. */
async function expectAllRowsContain(
  t: ITable,
  dataTable: DataTable,
  value: string,
): Promise<void> {
  await dataTable.expectLoaded();
  const { total } = await dataTable.paginator().range();
  if (total === 0) {
    await expect(dataTable.stateHeading(t.filteredEmpty ?? "")).toBeVisible();
    return;
  }
  const needle = value.trim().toLowerCase();
  // Poll: the filtered fetch may repaint the rows a tick after the filter helper
  // returns (a cache-served response fires no network event to wait on), so a
  // one-shot read can catch the pre-filter rows.
  await expect
    .poll(async () =>
      (await dataTable.columnTexts(t.nameColumn)).every((text) =>
        text.toLowerCase().includes(needle),
      ),
    )
    .toBe(true);
}

const expectPage = (dataTable: DataTable, pageNumber: number) =>
  expect(dataTable.paginator().currentPage()).toHaveValue(String(pageNumber));

const filtered = TABLES.filter((t) => t.filter);
const sortable = TABLES.filter((t) => t.sort.length > 0);

// --- Tests --------------------------------------------------------------------

test.describe("Data lists", () => {
  test.beforeAll(async ({ api }) => {
    test.setTimeout(180_000);
    await createSeed(api);
  });

  test.afterAll(async ({ api }) => {
    test.setTimeout(180_000);
    await deleteSeed(api);
  });

  // LIST-01
  for (const t of TABLES) {
    test(`LIST-01 ${t.name}: column headers`, async ({ page }) => {
      const dataTable = await open(page, t);
      expect(await dataTable.headerTexts()).toEqual(t.headers);
    });
  }

  // LIST-02
  const linkCases: { table: TableName; destination: "user" | "group" }[] = [
    { table: "Users", destination: "user" },
    { table: "Groups", destination: "group" },
    { table: "User groups", destination: "group" },
    { table: "Group users", destination: "user" },
  ];
  for (const { table: tableName, destination } of linkCases) {
    test(`LIST-02 ${tableName}: the name links to the ${destination} detail page`, async ({
      page,
    }) => {
      const t = table(tableName);
      const dataTable = await open(page, t);
      if (t.filter) {
        const target = destination === "user" ? seed.users[0] : seed.groups[0];
        await dataTable.filter(t.filter.title, target);
        await dataTable.expectLoaded();
      }
      // Group users can't be filtered (and has no stable order): use the first row.
      const link = dataTable.rows.first().getByRole("link");
      const target = (await link.innerText()).trim();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`/admin/${destination}s/\\d+$`));
      await expect(
        page.getByRole("heading", { level: 1, name: target, exact: true }),
      ).toBeVisible();
    });
  }
  for (const tableName of [
    "Roles",
    "Access policies",
    "User roles",
    "Group roles",
    "Select groups",
    "Select users",
    "Select roles (user)",
    "Select roles (group)",
  ] as const) {
    test(`LIST-02 ${tableName}: cells are plain text, not links`, async ({
      page,
    }) => {
      const dataTable = await openScoped(page, table(tableName));
      await expect(dataTable.rows.first()).toBeVisible();
      await expect(dataTable.rows.getByRole("link")).toHaveCount(0);
    });
  }

  // LIST-03
  for (const t of sortable) {
    test(`LIST-03 ${t.name}: sorted by ${t.sort[0].column} ascending by default`, async ({
      page,
      api,
    }) => {
      const dataTable = await openScoped(page, t);
      await dataTable.expectSorted(t.sort[0].column, "ascending");
      await expectOrder(api, t, dataTable, {
        column: t.sort[0],
        ordering: t.sort[0].key,
      });
    });
  }

  // LIST-04
  for (const t of sortable) {
    // One page load per table; each column is a step. Non-rank columns compare
    // against the scoped API page so the view is scoped with the filter; rank
    // columns (e.g. Locked) check rank order on the full list, so the filter is
    // cleared. Toggling the filter keeps the sort, so the first click on a column
    // not yet sorted goes ascending, and the default column (pre-sorted ascending)
    // turns around on its first click.
    test(`LIST-04 ${t.name}: every sortable column, both directions`, async ({
      page,
      api,
    }) => {
      const dataTable = await open(page, t);
      for (const [index, column] of t.sort.entries()) {
        await test.step(column.column, async () => {
          if (t.scopeFilter && t.filter) {
            if (column.rank) {
              await dataTable.filterInput(t.filter.title).fill("");
            } else {
              await dataTable.filter(t.filter.title, t.scopeFilter());
            }
            await dataTable.expectLoaded();
          }
          for (const clicks of [1, 2]) {
            const descending = index === 0 ? clicks === 1 : clicks === 2;
            const direction = descending ? "descending" : "ascending";
            await dataTable.sortBy(column.column);
            await dataTable.expectSorted(column.column, direction);
            if (column.column === "Locked") {
              await expect
                .poll(async () => (await dataTable.columnTexts("Locked"))[0])
                .toBe(descending ? "Yes" : "No");
            }
            await expectOrder(api, t, dataTable, {
              column,
              ordering: `${descending ? "-" : ""}${column.key}`,
            });
          }
        });
      }
    });
  }

  // LIST-05
  const nonSortable: [TableName, string[]][] = [
    ["Users", ["Email", "Active", "Groups"]],
    ["Roles", ["Plugin", "Description", "Permissions"]],
    ["Access policies", ["Statements"]],
    ["User roles", ["Permissions"]],
    ["Group users", ["Username"]],
    ["Group roles", ["Permissions"]],
    ["Select users", ["Name"]],
    ["Select roles (user)", ["Permissions"]],
    ["Select roles (group)", ["Permissions"]],
  ];
  for (const [tableName, columns] of nonSortable) {
    test(`LIST-05 ${tableName}: ${columns.join(", ")} show no sort control`, async ({
      page,
    }) => {
      const dataTable = await open(page, table(tableName));
      for (const column of columns) {
        await expect(dataTable.columnHeader(column)).toBeVisible();
        await expect(
          dataTable.columnHeader(column).getByRole("button"),
        ).toHaveCount(0);
      }
    });
  }

  // LIST-06
  for (const t of sortable) {
    test(`LIST-06 ${t.name}: changing the sort returns to page 1`, async ({
      page,
    }) => {
      const dataTable = await openScoped(page, t);
      await dataTable.paginator().next().click();
      await expectPage(dataTable, 2);
      await dataTable.sortBy(t.sort[t.sort.length - 1].column);
      await expectPage(dataTable, 1);
    });
  }

  // LIST-07
  const filterClasses: {
    input: string;
    check: (t: ITable, dataTable: DataTable, api: PulpApi) => Promise<void>;
  }[] = [
    {
      input: "the full value of one row",
      check: async (t, dataTable) => {
        const { full } = t.values!();
        await dataTable.filter(t.filter!.title, full);
        await expect(
          dataTable.rows.filter({
            has: dataTable.page.getByRole("gridcell", {
              name: full,
              exact: true,
            }),
          }),
        ).toBeVisible();
      },
    },
    {
      input: "a substring from the middle of a value",
      check: async (t, dataTable, api) => {
        const { middle } = t.values!();
        await dataTable.filter(t.filter!.title, middle);
        await expectAllRowsContain(t, dataTable, middle);
        const { count } = await apiPage(api, t, { filter: middle });
        expect(count).toBeGreaterThan(1);
        expect((await dataTable.paginator().range()).total).toBe(count);
      },
    },
    {
      input: "the value in different letter case",
      check: async (t, dataTable, api) => {
        const { middle } = t.values!();
        await dataTable.filter(t.filter!.title, middle.toUpperCase());
        await expectAllRowsContain(t, dataTable, middle);
        const { count } = await apiPage(api, t, { filter: middle });
        await expect
          .poll(async () => (await dataTable.paginator().range()).total)
          .toBe(count);
      },
    },
    {
      input: "a value that matches nothing",
      check: async (t, dataTable) => {
        await dataTable.filter(t.filter!.title, `nomatch-${seed.token}-zz`);
        await expect(dataTable.stateHeading(t.filteredEmpty!)).toBeVisible();
      },
    },
    {
      input: "%",
      check: async (t, dataTable) => {
        await dataTable.filter(t.filter!.title, "%");
        await expectAllRowsContain(t, dataTable, "%");
      },
    },
    {
      input: "_",
      check: async (t, dataTable) => {
        await dataTable.filter(t.filter!.title, "_");
        await expectAllRowsContain(t, dataTable, "_");
      },
    },
    {
      input: "unicode (ñ, 日本)",
      check: async (t, dataTable) => {
        for (const value of ["ñ", "日本"]) {
          await dataTable.filter(t.filter!.title, value);
          await expectAllRowsContain(t, dataTable, value);
        }
      },
    },
    {
      input: "a value with leading/trailing spaces",
      check: async (t, dataTable, api) => {
        const { middle } = t.values!();
        await dataTable.filter(t.filter!.title, `  ${middle}  `);
        await expectAllRowsContain(t, dataTable, middle);
        const { count } = await apiPage(api, t, { filter: middle });
        expect((await dataTable.paginator().range()).total).toBe(count);
      },
    },
    {
      input: "a single character",
      check: async (t, dataTable) => {
        const { single } = t.values!();
        await dataTable.filter(t.filter!.title, single);
        await expectAllRowsContain(t, dataTable, single);
      },
    },
  ];
  for (const t of filtered) {
    // One page load per table; each equivalence class is a step (it sets its own
    // filter, so the classes are independent on the same page).
    test(`LIST-07 ${t.name}: text filter equivalence classes`, async ({
      page,
      api,
    }) => {
      const dataTable = await open(page, t);
      for (const { input, check } of filterClasses) {
        await test.step(`filter by ${input}`, () => check(t, dataTable, api));
      }
    });
  }

  // LIST-08
  for (const t of filtered) {
    test(`LIST-08 ${t.name}: the filter waits for typing to stop`, async ({
      page,
    }) => {
      const dataTable = await open(page, t);
      const value = t.values!().middle;
      const filterRequests: string[] = [];
      page.on("request", (request) => {
        if (request.method() === "GET" && /__icontains=/.test(request.url())) {
          filterRequests.push(request.url());
        }
      });
      const settled = page.waitForResponse(
        (response) =>
          /__icontains=/.test(response.url()) &&
          decodeURIComponent(response.url()).includes(value),
      );
      // Faster than the 300 ms debounce, so only the final value is requested.
      await dataTable.filterInput(t.filter!.title).pressSequentially(value, {
        delay: 40,
      });
      await settled;
      await dataTable.expectLoaded();
      expect(filterRequests).toHaveLength(1);
    });
  }

  // LIST-09
  for (const t of filtered) {
    test(`LIST-09 ${t.name}: typing a filter returns to page 1`, async ({
      page,
    }) => {
      const dataTable = await open(page, t);
      await dataTable.paginator().next().click();
      await expectPage(dataTable, 2);
      await dataTable.filter(t.filter!.title, t.values!().middle);
      await expectPage(dataTable, 1);
    });
  }
  test("LIST-09 Roles: choosing a Locked option returns to page 1", async ({
    page,
    rolesPage,
  }) => {
    const dataTable = await open(page, table("Roles"));
    await dataTable.paginator().next().click();
    await expectPage(dataTable, 2);
    await rolesPage.filterLocked("Unlocked");
    await expectPage(dataTable, 1);
  });

  // LIST-10
  const removals: {
    action: string;
    run: (t: ITable, dataTable: DataTable, value: string) => Promise<void>;
  }[] = [
    {
      action: "remove the filter chip",
      run: (_t, dataTable, value) => dataTable.removeChip(value),
    },
    {
      action: 'click "Clear filters" in the toolbar',
      run: (_t, dataTable) => dataTable.clearAllFiltersInToolbar().click(),
    },
    {
      action: "delete the text from the filter input",
      run: (t, dataTable) => dataTable.filter(t.filter!.title, ""),
    },
  ];
  for (const t of filtered) {
    for (const { action, run } of removals) {
      test(`LIST-10 ${t.name}: ${action} clears the filter`, async ({
        page,
      }) => {
        const dataTable = await open(page, t);
        const value = t.values!().full;
        await dataTable.filter(t.filter!.title, value);
        await dataTable.expectLoaded();
        const filteredTotal = (await dataTable.paginator().range()).total;
        await run(t, dataTable, value);
        await expect(dataTable.filterInput(t.filter!.title)).toHaveValue("");
        await expect(
          dataTable.scope.getByRole("button", { name: `Close ${value}` }),
        ).toHaveCount(0);
        await expect
          .poll(async () => (await dataTable.paginator().range()).total)
          .toBeGreaterThan(filteredTotal);
      });
    }
  }

  // LIST-11
  const emptyCases: {
    table: TableName;
    title: string;
    owner: "user" | "group";
  }[] = [
    {
      table: "User groups",
      title: "User is not a member of any group",
      owner: "user",
    },
    {
      table: "User roles",
      title: "No roles assigned to this user",
      owner: "user",
    },
    { table: "Group users", title: "No users in this group", owner: "group" },
    {
      table: "Group roles",
      title: "No roles assigned to this group",
      owner: "group",
    },
  ];
  for (const { table: tableName, title, owner } of emptyCases) {
    test(`LIST-11 ${tableName}: "${title}" with no action button`, async ({
      page,
      api,
      cleanup,
    }) => {
      const t = table(tableName);
      let heading: string;
      if (owner === "user") {
        const created = await api.createUser({
          username: cleanup.user(uniqueName("user")),
        });
        heading = created.username;
        await gotoHeading(page, `/admin/users/${created.id}`, heading);
      } else {
        const created = await api.createGroup(
          cleanup.group(uniqueName("group")),
        );
        heading = created.name;
        await gotoHeading(page, `/admin/groups/${created.id}`, heading);
      }
      if (tableName.endsWith("roles")) await clickTab(page, "Roles");
      const dataTable = new DataTable(t.scope(page), t.grid);
      await expect(dataTable.stateHeading(title)).toBeVisible();
      // No action button in the empty body; a sortable column still has its header
      // sort button, so scope the check to the body rows.
      await expect(dataTable.rows.getByRole("button")).toHaveCount(0);
    });
  }

  // LIST-12
  for (const t of filtered) {
    test(`LIST-12 ${t.name}: filtered empty state "${t.filteredEmpty}"`, async ({
      page,
    }) => {
      const dataTable = await open(page, t);
      await dataTable.filter(t.filter!.title, `nomatch-${seed.token}-zz`);
      await expect(dataTable.stateHeading(t.filteredEmpty!)).toBeVisible();
      await expect(dataTable.grid).toContainText(
        "No results match the current filter. Try adjusting or clearing your filters.",
      );
      await dataTable.clearAllFiltersInEmptyState().click();
      await expect(dataTable.filterInput(t.filter!.title)).toHaveValue("");
      await dataTable.expectLoaded();
      await expect(dataTable.stateHeading(t.filteredEmpty!)).toBeHidden();
    });
  }

  // LIST-13
  for (const t of TABLES) {
    test(`LIST-13 ${t.name}: skeleton rows until the rows load`, async ({
      page,
    }) => {
      await t.prepare(page);
      const held = await delayApi(page, { url: t.request, method: "GET" });
      await t.reveal(page);
      const dataTable = new DataTable(t.scope(page), t.grid);
      await expect.poll(() => held.held()).toBeGreaterThan(0);
      await expect(dataTable.rows.first()).toBeVisible();
      await expect(dataTable.rows.first()).toHaveText(/^\s*$/);
      held.release();
      await dataTable.expectLoaded();
    });
  }

  // LIST-14
  for (const t of TABLES) {
    test(`LIST-14 ${t.name}: server error state`, () => {
      test.skip(true, "Manual: needs the server to fail while loading");
    });
  }

  // LIST-20
  test.describe("LIST-20 tables a non-superuser cannot read", () => {
    const cases: {
      table: string;
      role: string;
      reach: (page: Page) => Promise<DataTable>;
    }[] = [
      {
        table: "Group roles",
        role: "core.group_viewer",
        reach: async (page) => {
          await clickTab(page, "Roles");
          return new DataTable(page.getByRole("tabpanel"), "Group roles table");
        },
      },
      {
        table: "Select users",
        role: "core.group_owner",
        reach: async (page) => {
          await clickButton(page, "Add User");
          return new DataTable(
            dialog(page, "Add User to Group"),
            "Select users",
          );
        },
      },
      {
        table: "Select roles (group)",
        role: "core.group_viewer",
        reach: async (page) => {
          await clickTab(page, "Roles");
          await clickButton(page, "Add Role");
          return new DataTable(
            dialog(page, "Add Role to Group"),
            "Select roles",
          );
        },
      },
    ];
    for (const { table: tableName, role, reach } of cases) {
      test(`LIST-20 ${tableName}: "403: Access denied" for a non-superuser`, async ({
        api,
        cleanup,
        secondUser,
      }) => {
        const group = await api.createGroup(cleanup.group(uniqueName("group")));
        const user = await secondUser.create();
        await api.assignRole(
          { user: user.username },
          { role, contentObject: group.pulp_href },
        );
        const page = await secondUser.login(user);
        await gotoHeading(page, `/admin/groups/${group.id}`, group.name);
        const dataTable = await reach(page);
        await expect(
          dataTable.stateHeading("403: Access denied"),
        ).toBeVisible();
      });
    }
  });

  // LIST-15
  const pagingActions: {
    action: string;
    setup?: (p: ReturnType<DataTable["paginator"]>) => Promise<void>;
    act: (p: ReturnType<DataTable["paginator"]>) => Promise<void>;
    expectPageNumber: (lastPage: number) => number;
  }[] = [
    {
      action: "next page",
      // Reset to page 1 via the page input: "Go to first page" is disabled there,
      // so clicking it would hang on the top-paginator pass.
      setup: (p) => p.goToPage(1),
      act: (p) => p.next().click(),
      expectPageNumber: () => 2,
    },
    {
      action: "previous page from page 2",
      setup: (p) => p.goToPage(2),
      act: (p) => p.previous().click(),
      expectPageNumber: () => 1,
    },
    {
      action: "last page",
      setup: (p) => p.goToPage(1),
      act: (p) => p.last().click(),
      expectPageNumber: (lastPage) => lastPage,
    },
    {
      action: "first page from the last page",
      setup: (p) => p.last().click(),
      act: (p) => p.first().click(),
      expectPageNumber: () => 1,
    },
    {
      action: "a typed page number",
      setup: (p) => p.goToPage(1),
      act: (p) => p.goToPage(2),
      expectPageNumber: () => 2,
    },
  ];
  for (const t of TABLES) {
    // One page load per table; each action resets to a known page in its setup,
    // so the actions are independent steps on the same table.
    test(`LIST-15 ${t.name}: paging from the top and the bottom paginator`, async ({
      page,
    }) => {
      const dataTable = await openForPaging(page, t);
      const { total } = await dataTable.paginator().range();
      const lastPage = Math.ceil(total / t.pageSize);
      expect(lastPage).toBeGreaterThan(2);
      for (const { action, setup, act, expectPageNumber } of pagingActions) {
        await test.step(action, async () => {
          for (const which of ["top", "bottom"] as const) {
            const paginator = dataTable.paginator(which);
            // Start every action from page 1: a previous action may have left the
            // table on the last page, where a setup that clicks "last" is disabled.
            await dataTable.paginator().goToPage(1);
            await dataTable.expectLoaded();
            if (setup) {
              await setup(paginator);
              await dataTable.expectLoaded();
            }
            const before = await dataTable.rows.first().innerText();
            await act(paginator);
            const pageNumber = expectPageNumber(lastPage);
            await expectPage(dataTable, pageNumber);
            await expect(
              dataTable.paginator("bottom").currentPage(),
            ).toHaveValue(String(pageNumber));
            const first = (pageNumber - 1) * t.pageSize + 1;
            const last = Math.min(pageNumber * t.pageSize, total);
            const range = `${first} - ${last} of ${total}`;
            await dataTable.paginator("top").expectRange(range);
            await dataTable.paginator("bottom").expectRange(range);
            await expect(dataTable.rows).toHaveCount(last - first + 1);
            await expect(dataTable.rows.first()).not.toHaveText(before);
          }
        });
      }
    });
  }

  // LIST-16
  for (const t of TABLES) {
    test(`LIST-16 ${t.name}: page size`, async ({ page }) => {
      const dataTable = await openForPaging(page, t);
      const { total } = await dataTable.paginator().range();
      expect(total).toBeGreaterThan(20);
      for (const size of [10, 20] as const) {
        await test.step(`${size} per page`, async () => {
          await dataTable.paginator().next().click();
          await expectPage(dataTable, 2);
          await dataTable.paginator().setPerPage(size);
          await expectPage(dataTable, 1);
          await dataTable.paginator().expectRange(`1 - ${size} of ${total}`);
          await expect(dataTable.rows).toHaveCount(size);
        });
      }
    });
  }

  // LIST-17
  for (const t of TABLES) {
    test(`LIST-17 ${t.name}: the total matches the rows, also after a filter`, async ({
      page,
      api,
    }) => {
      const dataTable = await openForPaging(page, t);
      const { count } = await apiPage(api, t, {
        filter: t.stable ? undefined : t.scopeFilter?.(),
      });
      expect((await dataTable.paginator().range()).total).toBe(count);
      if (!t.filter) return;
      const { middle } = t.values!();
      await dataTable.filter(t.filter.title, middle);
      const filteredCount = (await apiPage(api, t, { filter: middle })).count;
      await expect
        .poll(async () => (await dataTable.paginator().range()).total)
        .toBe(filteredCount);
    });
  }

  // LIST-18
  const orders: { order: string; steps: ("filter" | "sort" | "page2")[] }[] = [
    { order: "filter, then sort descending", steps: ["filter", "sort"] },
    { order: "sort descending, then filter", steps: ["sort", "filter"] },
    {
      order: "go to page 2, filter, then sort",
      steps: ["page2", "filter", "sort"],
    },
    {
      order: "go to page 2, sort, then filter",
      steps: ["page2", "sort", "filter"],
    },
  ];
  for (const t of sortable.filter((s) => s.filter)) {
    // Each order re-navigates (its steps include "go to page 2" and the end state
    // must be page 1 regardless of order), so it stays a test per order.
    for (const { order, steps } of orders) {
      test(`LIST-18 ${t.name}: ${order}`, async ({ page, api }) => {
        const dataTable = await open(page, t);
        const value = t.scopeFilter?.() ?? t.values!().middle;
        for (const step of steps) {
          if (step === "filter") await dataTable.filter(t.filter!.title, value);
          else if (step === "sort") await dataTable.sortBy(t.sort[0].column);
          else {
            await dataTable.paginator().next().click();
            await expectPage(dataTable, 2);
          }
          await dataTable.expectLoaded();
        }
        await expectPage(dataTable, 1);
        await dataTable.expectSorted(t.sort[0].column, "descending");
        const { names } = await apiPage(api, t, {
          filter: value,
          ordering: `-${t.sort[0].key}`,
        });
        await expect
          .poll(() => dataTable.columnTexts(t.nameColumn))
          .toEqual(names);
      });
    }
  }

  // LIST-19
  for (const tableName of [
    "Users",
    "Groups",
    "Roles",
    "User groups",
    "User roles",
    "Group users",
    "Group roles",
  ] as const) {
    test(`LIST-19 ${tableName}: removing the last row on a page`, () => {
      test.fixme(
        true,
        "Open: decide whether the list moves to page 1 or shows an empty page 2",
      );
    });
  }
});
