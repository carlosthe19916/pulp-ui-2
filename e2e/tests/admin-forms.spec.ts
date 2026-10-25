import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import type { Cleanup } from "./helpers/cleanup";
import type { PulpApi } from "./helpers/pulp-api";
import { STRONG_PASSWORD, uniqueName } from "./helpers/unique";
import { AccessPoliciesPage } from "./pom/AccessPoliciesPage";
import { FormModal } from "./pom/FormModal";
import { GroupsPage } from "./pom/GroupsPage";
import { RolesPage } from "./pom/RolesPage";
import type { Toasts } from "./pom/Toasts";
import { UsersPage } from "./pom/UsersPage";

// Scenarios: e2e/specs/shared/form-modal.md (FORM-*), run once per modal.

/** A viewset no other spec edits; saving its own statements changes no behaviour. */
const POLICY_VIEWSET = "content/ostree/configs";

interface IFx {
  page: Page;
  api: PulpApi;
  cleanup: Cleanup;
}

interface ICtx {
  /** The record an edit modal edits (username, group, role or viewset). */
  target: string;
  /** Another existing record whose name the server rejects as a duplicate. */
  other: string;
  /** A unique value, registered for cleanup, to type into a name field. */
  fresh: string;
  /** The value `field` holds when the modal opens. */
  saved: string;
  /** The target's numeric id, for detail URLs. */
  id?: number;
}

interface IModal {
  name: string;
  kind: "create" | "edit";
  submit: "Create" | "Save";
  writeMethod: "POST" | "PATCH";
  title: (ctx: ICtx) => string;
  seed: (fx: IFx) => Promise<ICtx>;
  open: (fx: IFx, ctx: ICtx) => Promise<FormModal>;
  /** The text field FORM-02 / FORM-03 change. */
  field: string;
  /** Server state that closing without saving must leave unchanged. */
  state: (fx: IFx, ctx: ICtx) => Promise<unknown>;
  /** Fill valid values; returns the success toast. */
  fillValid: (modal: FormModal, ctx: ICtx) => Promise<string>;
  /** Enter something the server rejects; returns its reason. */
  reject: (modal: FormModal, ctx: ICtx) => Promise<string>;
  fix: (modal: FormModal, ctx: ICtx) => Promise<void>;
  /** A single-line text field where Enter submits; none for JSON text areas. */
  enterField?: string;
  /** FORM-12: the change shows without a reload. */
  expectPlaces: (fx: IFx, ctx: ICtx) => Promise<void>;
}

// --- Seeds -----------------------------------------------------------------

const seedUsers = async ({ api, cleanup }: IFx): Promise<ICtx> => {
  const target = cleanup.user(uniqueName("user"));
  const other = cleanup.user(uniqueName("user"));
  const record = await api.createUser({
    username: target,
    first_name: "Before",
    email: `${target}@example.com`,
  });
  await api.createUser({ username: other });
  return {
    target,
    other,
    fresh: cleanup.user(uniqueName("user")),
    saved: "Before",
    id: record.id,
  };
};

const seedGroups = async ({ api, cleanup }: IFx): Promise<ICtx> => {
  const target = cleanup.group(uniqueName("group"));
  const other = cleanup.group(uniqueName("group"));
  const record = await api.createGroup(target);
  await api.createGroup(other);
  return {
    target,
    other,
    fresh: cleanup.group(uniqueName("group")),
    saved: target,
    id: record.id,
  };
};

const ROLE_DESCRIPTION = "Seeded description";

const seedRoles = async ({ api, cleanup }: IFx): Promise<ICtx> => {
  const target = cleanup.role(uniqueName("role"));
  const other = cleanup.role(uniqueName("role"));
  await api.createRole({
    name: target,
    description: ROLE_DESCRIPTION,
    permissions: ["core.view_task"],
  });
  await api.createRole({ name: other });
  return {
    target,
    other,
    fresh: cleanup.role(uniqueName("role")),
    saved: ROLE_DESCRIPTION,
  };
};

const seedPolicy = async ({ api, cleanup }: IFx): Promise<ICtx> => {
  cleanup.accessPolicy(POLICY_VIEWSET);
  const policy = await api.accessPolicy(POLICY_VIEWSET);
  return {
    target: POLICY_VIEWSET,
    other: "",
    fresh: uniqueName("policy"),
    // The form shows the saved statements as indented JSON.
    saved: JSON.stringify(policy.statements, null, 2),
  };
};

// --- Openers ---------------------------------------------------------------

const openFromHeader = async (
  page: Page,
  { url, item, title }: { url: string; item: string; title: string },
): Promise<FormModal> => {
  await page.goto(url);
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: item, exact: true }).click();
  return new FormModal(page, title);
};

const openFromRow = async (
  list: UsersPage | GroupsPage | RolesPage,
  { filter, name, title }: { filter: string; name: string; title: string },
): Promise<FormModal> => {
  await list.goto();
  await list.filterBy(filter, name);
  await list.rowAction(name, "Edit");
  return new FormModal(list.page, title);
};

// --- Modals ----------------------------------------------------------------

const createUser: IModal = {
  name: "Create user",
  kind: "create",
  submit: "Create",
  writeMethod: "POST",
  title: () => "Create User",
  seed: seedUsers,
  open: async ({ page }) => {
    const users = new UsersPage(page);
    await users.goto();
    await page
      .getByRole("button", { name: "Create user", exact: true })
      .click();
    return new FormModal(page, "Create User");
  },
  field: "Username",
  state: async ({ api }, { fresh }) => (await api.user(fresh)) ?? null,
  fillValid: async (modal, { fresh }) => {
    await modal.field("Username").fill(fresh);
    await modal.field("Password").fill(STRONG_PASSWORD);
    return `User "${fresh}" created`;
  },
  reject: async (modal, { other }) => {
    await modal.field("Username").fill(other);
    await modal.field("Password").fill(STRONG_PASSWORD);
    return "This field must be unique.";
  },
  fix: async (modal, { fresh }) => {
    await modal.field("Username").fill(fresh);
  },
  enterField: "Password",
  expectPlaces: async ({ page }, { fresh }) => {
    const users = new UsersPage(page);
    await users.filterBy("Username", fresh);
    await users.expectRowVisible(fresh);
  },
};

const editUserFields = {
  kind: "edit",
  submit: "Save",
  writeMethod: "PATCH",
  title: ({ target }) => `Edit ${target}`,
  seed: seedUsers,
  field: "First name",
  state: async ({ api }, { target }) => api.user(target),
  fillValid: async (modal, { target }) => {
    await modal.field("First name").fill("After");
    await modal.field("Email").fill(`after-${target}@example.com`);
    return `User "${target}" updated`;
  },
  reject: async (modal) => {
    // Passes the form's email check; Pulp wants a top-level domain.
    await modal.field("Email").fill("alice@example");
    return "Enter a valid email address.";
  },
  fix: async (modal) => {
    await modal.field("Email").fill("fixed@example.com");
  },
  enterField: "First name",
} satisfies Partial<IModal>;

const expectUserPlaces = async (
  { page, api }: IFx,
  { target, id }: ICtx,
): Promise<void> => {
  const email = `after-${target}@example.com`;
  await expect.poll(async () => (await api.user(target))?.email).toBe(email);
  const users = new UsersPage(page);
  await users.goto();
  await users.filterBy("Username", target);
  await expect(users.row(target)).toContainText(email);
  // The detail page has no field display; its edit form shows the saved values.
  const modal = await openFromHeader(page, {
    url: `/admin/users/${id}`,
    item: "Edit User",
    title: `Edit ${target}`,
  });
  await expect(modal.field("Email")).toHaveValue(email);
  await expect(modal.field("First name")).toHaveValue("After");
};

const editUserList: IModal = {
  ...editUserFields,
  name: "Edit user (list)",
  open: ({ page }, { target }) =>
    openFromRow(new UsersPage(page), {
      filter: "Username",
      name: target,
      title: `Edit ${target}`,
    }),
  expectPlaces: expectUserPlaces,
};

const editUserDetail: IModal = {
  ...editUserFields,
  name: "Edit user (detail)",
  open: ({ page }, { target, id }) =>
    openFromHeader(page, {
      url: `/admin/users/${id}`,
      item: "Edit User",
      title: `Edit ${target}`,
    }),
  expectPlaces: expectUserPlaces,
};

const createGroup: IModal = {
  name: "Create group",
  kind: "create",
  submit: "Create",
  writeMethod: "POST",
  title: () => "Create Group",
  seed: seedGroups,
  open: async ({ page }) => {
    await new GroupsPage(page).goto();
    await page
      .getByRole("button", { name: "Create Group", exact: true })
      .click();
    return new FormModal(page, "Create Group");
  },
  field: "Name",
  state: async ({ api }, { fresh }) => (await api.group(fresh)) ?? null,
  fillValid: async (modal, { fresh }) => {
    await modal.field("Name").fill(fresh);
    return `Group "${fresh}" created`;
  },
  reject: async (modal, { other }) => {
    await modal.field("Name").fill(other);
    return "This field must be unique.";
  },
  fix: async (modal, { fresh }) => {
    await modal.field("Name").fill(fresh);
  },
  enterField: "Name",
  expectPlaces: async ({ page }, { fresh }) => {
    const groups = new GroupsPage(page);
    await groups.filterBy("Name", fresh);
    await groups.expectRowVisible(fresh);
  },
};

const editGroupFields = {
  kind: "edit",
  submit: "Save",
  writeMethod: "PATCH",
  title: ({ target }) => `Edit ${target}`,
  seed: seedGroups,
  field: "Name",
  state: async ({ api }, { target, fresh }) => [
    await api.group(target),
    (await api.group(fresh)) ?? null,
  ],
  fillValid: async (modal, { fresh }) => {
    await modal.field("Name").fill(fresh);
    return `Group "${fresh}" updated`;
  },
  reject: async (modal, { other }) => {
    await modal.field("Name").fill(other);
    return "This field must be unique.";
  },
  fix: async (modal, { fresh }) => {
    await modal.field("Name").fill(fresh);
  },
  enterField: "Name",
} satisfies Partial<IModal>;

const editGroupList: IModal = {
  ...editGroupFields,
  name: "Edit group (list)",
  open: ({ page }, { target }) =>
    openFromRow(new GroupsPage(page), {
      filter: "Name",
      name: target,
      title: `Edit ${target}`,
    }),
  expectPlaces: async ({ page }, { fresh }) => {
    const groups = new GroupsPage(page);
    await groups.filterBy("Name", fresh);
    await groups.expectRowVisible(fresh);
  },
};

const editGroupDetail: IModal = {
  ...editGroupFields,
  name: "Edit group (detail)",
  open: ({ page }, { target, id }) =>
    openFromHeader(page, {
      url: `/admin/groups/${id}`,
      item: "Edit Group",
      title: `Edit ${target}`,
    }),
  expectPlaces: async ({ page }, { fresh }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: fresh, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toContainText(fresh);
    await expect(page).toHaveTitle(new RegExp(`Group · ${fresh}`));
    await page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("link", { name: "Groups", exact: true })
      .click();
    const groups = new GroupsPage(page);
    await groups.filterBy("Name", fresh);
    await groups.expectRowVisible(fresh);
  },
};

const createRole: IModal = {
  name: "Create role",
  kind: "create",
  submit: "Create",
  writeMethod: "POST",
  title: () => "Create Role",
  seed: seedRoles,
  open: async ({ page }) => {
    await new RolesPage(page).goto();
    await page
      .getByRole("button", { name: "Create Role", exact: true })
      .click();
    return new FormModal(page, "Create Role");
  },
  field: "Name",
  state: async ({ api }, { fresh }) => (await api.role(fresh)) ?? null,
  fillValid: async (modal, { fresh }) => {
    await modal.field("Name").fill(fresh);
    return `Role "${fresh}" created`;
  },
  reject: async (modal, { other }) => {
    await modal.field("Name").fill(other);
    return "This field must be unique.";
  },
  fix: async (modal, { fresh }) => {
    await modal.field("Name").fill(fresh);
  },
  enterField: "Name",
  expectPlaces: async ({ page, api, cleanup }, { fresh }) => {
    const roles = new RolesPage(page);
    await roles.filterBy("Name", fresh);
    await roles.expectRowVisible(fresh);
    const username = cleanup.user(uniqueName("user"));
    const user = await api.createUser({ username });
    await page.goto(`/admin/users/${user.id}`);
    await page.getByRole("tab", { name: /^Roles \(\d+\)$/ }).click();
    await page.getByRole("button", { name: "Add Role", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Filter by Role").fill(fresh);
    await expect(
      dialog.getByRole("grid", { name: "Select roles" }).getByRole("row", {
        name: new RegExp(fresh),
      }),
    ).toBeVisible();
  },
};

const editRole: IModal = {
  name: "Edit role",
  kind: "edit",
  submit: "Save",
  writeMethod: "PATCH",
  title: ({ target }) => `Edit Role: ${target}`,
  seed: async (fx) => {
    const ctx = await seedRoles(fx);
    // Holders whose Roles tabs must show the edit (FORM-12).
    const username = fx.cleanup.user(uniqueName("user"));
    const group = fx.cleanup.group(uniqueName("group"));
    const user = await fx.api.createUser({ username });
    const created = await fx.api.createGroup(group);
    await fx.api.assignRole({ user: username }, { role: ctx.target });
    await fx.api.assignRole({ group }, { role: ctx.target });
    return { ...ctx, id: user.id, other: `${ctx.other}|${created.id}` };
  },
  open: ({ page }, { target }) =>
    openFromRow(new RolesPage(page), {
      filter: "Name",
      name: target,
      title: `Edit Role: ${target}`,
    }),
  field: "Description",
  state: async ({ api }, { target }) => api.role(target),
  fillValid: async (modal, { target }) => {
    await modal.field("Description").fill("Changed description");
    return `Role "${target}" updated`;
  },
  reject: async (modal) => {
    const input = modal.dialog.getByRole("textbox", { name: "Add permission" });
    await input.fill("core.not_a_permission");
    await input.press("Enter");
    return "Permission 'core.not_a_permission' does not exist.";
  },
  fix: async (modal) => {
    await modal.button("Remove core.not_a_permission").click();
  },
  enterField: "Description",
  expectPlaces: async ({ page }, { target, id, other }) => {
    const roles = new RolesPage(page);
    await roles.filterBy("Name", target);
    await expect(roles.row(target)).toContainText("Changed description");
    const groupId = other.split("|")[1];
    for (const [url, grid] of [
      [`/admin/users/${id}`, "User roles table"],
      [`/admin/groups/${groupId}`, "Group roles table"],
    ]) {
      await page.goto(url);
      await page.getByRole("tab", { name: /^Roles \(\d+\)$/ }).click();
      await expect(
        page.getByRole("grid", { name: grid }).getByRole("row", {
          name: new RegExp(target),
        }),
      ).toContainText("Changed description");
    }
  },
};

const editPolicy: IModal = {
  name: "Edit policy",
  kind: "edit",
  submit: "Save",
  writeMethod: "PATCH",
  title: ({ target }) => `Edit policy "${target}"`,
  seed: seedPolicy,
  open: async ({ page }, { target }) => {
    const policies = new AccessPoliciesPage(page);
    await policies.goto();
    await policies.find(target);
    return policies.openEdit(target);
  },
  field: "Statements",
  state: async ({ api }) => api.accessPolicy(POLICY_VIEWSET),
  fillValid: async (modal, { target, saved }) => {
    await modal.field("Statements").fill(saved);
    return `Policy "${target}" saved`;
  },
  reject: async (modal) => {
    await modal.field("Statements").fill("{}");
    return 'Expected a list of items but got type "dict".';
  },
  fix: async (modal, { saved }) => {
    await modal.field("Statements").fill(saved);
  },
  expectPlaces: async ({ page }, { target }) => {
    const policies = new AccessPoliciesPage(page);
    await expect(policies.exactRow(target)).toContainText("Customized");
  },
};

const MODALS: IModal[] = [
  createUser,
  editUserList,
  editUserDetail,
  createGroup,
  editGroupList,
  editGroupDetail,
  createRole,
  editRole,
  editPolicy,
];

const byName = (name: string): IModal => {
  const modal = MODALS.find((m) => m.name === name);
  if (!modal) throw new Error(`No modal "${name}"`);
  return modal;
};

/** Edit policy tests, defined last in one serial block (see the end of the file). */
const policyTests: (() => void)[] = [];

const forEachModal = (body: (modal: IModal) => void): void => {
  for (const modal of MODALS.filter((m) => m !== editPolicy)) body(modal);
  policyTests.push(() => body(editPolicy));
};

// --- FORM-12: success round-trip (real backend) ---------------------------

forEachModal((modal) => {
  test(`FORM-12 ${modal.name}: success closes, toasts and shows the change`, async ({
    page,
    api,
    cleanup,
    toasts,
  }) => {
    // Checks the change on up to three pages.
    test.slow();
    const fx = { page, api, cleanup };
    const ctx = await modal.seed(fx);
    const form = await modal.open(fx, ctx);
    const toast = await modal.fillValid(form, ctx);
    await form.button(modal.submit).click();
    await form.expectClosed();
    await expect(toasts.success(toast)).toBeVisible();
    await modal.expectPlaces(fx, ctx);
  });
});

// --- FORM-09: server rejection -----------------------------------------------

const FORM_09: {
  modal: string;
  input: string;
  enter: (form: FormModal, ctx: ICtx) => Promise<void>;
  kept: { field: string; value: (ctx: ICtx) => string };
  reason: string;
}[] = [
  // The specific server rules are contract tests (tests/api/*.api.spec.ts); these
  // two prove the UI surfaces a server rejection in the form — a field error and
  // the policy JSON textarea.
  {
    modal: "Create user",
    input: "a username that already exists",
    enter: async (form, ctx) => {
      await form.field("Username").fill(ctx.other);
      await form.field("Password").fill(STRONG_PASSWORD);
    },
    kept: { field: "Username", value: (ctx) => ctx.other },
    reason: "This field must be unique.",
  },
  {
    modal: "Edit policy",
    input: "statements that are not a list ({})",
    enter: async (form) => form.field("Statements").fill("{}"),
    kept: { field: "Statements", value: () => "{}" },
    reason: 'Expected a list of items but got type "dict".',
  },
];

/** One FORM-09 row as a step: the submit is rejected and the form keeps its value. */
const runForm09 = async (
  row: (typeof FORM_09)[number],
  fx: IFx,
  toasts: Toasts,
): Promise<void> => {
  await test.step(`${row.modal}: ${row.input} → "${row.reason}"`, async () => {
    const modal = byName(row.modal);
    const ctx = await modal.seed(fx);
    const form = await modal.open(fx, ctx);
    await row.enter(form, ctx);
    await form.button(modal.submit).click();
    await form.expectSubmitError(row.reason);
    await toasts.expectNone();
    await expect(form.dialog).toBeVisible();
    await expect(form.field(row.kept.field)).toHaveValue(row.kept.value(ctx));
  });
};

// Edit policy mutates a server-wide record, so its rows run in the serial block
// at the end; every other row runs as a step in this one parallel test.
const form09Parallel = FORM_09.filter(
  (row) => byName(row.modal) !== editPolicy,
);
const form09Policy = FORM_09.filter((row) => byName(row.modal) === editPolicy);

test("FORM-09 a server rejection surfaces in the form", async ({
  page,
  api,
  cleanup,
  toasts,
}) => {
  const fx = { page, api, cleanup };
  for (const row of form09Parallel) await runForm09(row, fx, toasts);
});

if (form09Policy.length > 0)
  policyTests.push(() =>
    test("FORM-09 a server rejection surfaces in the policy form", async ({
      page,
      api,
      cleanup,
      toasts,
    }) => {
      const fx = { page, api, cleanup };
      for (const row of form09Policy) await runForm09(row, fx, toasts);
    }),
  );

// --- FORM-10: permission denied ----------------------------------------------

const PERMISSION_DENIED =
  "You do not have permission to perform this action. Ask an administrator to grant the required role.";

const FORM_10: {
  modal: string;
  open: (page: Page) => Promise<FormModal>;
  fallback: string;
}[] = [
  {
    modal: "Create user",
    open: async (page) => {
      await page.goto("/admin/users");
      await page
        .getByRole("button", { name: "Create user", exact: true })
        .click();
      const form = new FormModal(page, "Create User");
      await form.field("Username").fill(uniqueName("denied"));
      await form.field("Password").fill(STRONG_PASSWORD);
      return form;
    },
    fallback: "Failed to create user",
  },
  {
    modal: "Create role",
    open: async (page) => {
      await page.goto("/admin/roles");
      await page
        .getByRole("button", { name: "Create Role", exact: true })
        .click();
      const form = new FormModal(page, "Create Role");
      await form.field("Name").fill(uniqueName("denied"));
      return form;
    },
    fallback: "Failed to create role",
  },
  {
    modal: "Create group",
    open: async (page) => {
      await page.goto("/admin/groups");
      await page
        .getByRole("button", { name: "Create Group", exact: true })
        .click();
      const form = new FormModal(page, "Create Group");
      await form.field("Name").fill(uniqueName("denied"));
      return form;
    },
    fallback: "Failed to create group",
  },
];

test("FORM-10 create permission denied shows a fallback alert", async ({
  secondUser,
}) => {
  // Logs one second user in through the login form, then tries each create.
  test.slow();
  const user = await secondUser.create();
  const page = await secondUser.login(user);
  for (const row of FORM_10) {
    await test.step(`${row.modal}: permission denied shows "${row.fallback}"`, async () => {
      const form = await row.open(page);
      await form.button("Create").click();
      await expect(
        form.dialog.getByRole("heading", {
          name: `Danger alert: ${row.fallback}`,
        }),
      ).toBeVisible();
      await expect(form.dialog).toContainText(PERMISSION_DENIED);
    });
  }
});

test('FORM-10 Edit group: permission denied shows "Failed to update group"', async ({
  api,
  cleanup,
  secondUser,
}) => {
  test.slow();
  const group = cleanup.group(uniqueName("group"));
  const viewer = cleanup.role(uniqueName("role"));
  const changer = cleanup.role(uniqueName("role"));
  const { pulp_href: groupHref } = await api.createGroup(group);
  await api.createRole({ name: viewer, permissions: ["core.view_group"] });
  await api.createRole({ name: changer, permissions: ["core.change_group"] });
  const user = await secondUser.create();
  await api.assignRole(
    { user: user.username },
    { role: viewer, contentObject: groupHref },
  );
  const change = await api.assignRole(
    { user: user.username },
    { role: changer, contentObject: groupHref },
  );

  const page = await secondUser.login(user);
  const groups = new GroupsPage(page);
  await groups.goto();
  await groups.filterBy("Name", group);
  await groups.rowAction(group, "Edit");
  const form = new FormModal(page, `Edit ${group}`);
  await expect(form.dialog).toBeVisible();
  // Revoked after the page loaded, so the form is still open and enabled.
  await api.removeRoleAssignment(change.pulp_href);
  await form.field("Name").fill(cleanup.group(uniqueName("group")));
  await form.button("Save").click();
  await expect(
    form.dialog.getByRole("heading", {
      name: "Danger alert: Failed to update group",
    }),
  ).toBeVisible();
  await expect(form.dialog).toContainText(PERMISSION_DENIED);
});

// Edit policy changes a server-wide record, so all its tests run in one serial block.
test.describe("Edit policy", () => {
  test.describe.configure({ mode: "serial" });
  for (const define of policyTests) define();
});
