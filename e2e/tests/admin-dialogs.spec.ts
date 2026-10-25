import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import type { Cleanup } from "./helpers/cleanup";
import { delayApi } from "./helpers/delayApi";
import { recordApiNotFound } from "./helpers/notFound";
import type { PulpApi } from "./helpers/pulp-api";
import { uniqueName } from "./helpers/unique";
import { AccessPoliciesPage } from "./pom/AccessPoliciesPage";
import { ConfirmModal } from "./pom/ConfirmModal";
import { GroupsPage } from "./pom/GroupsPage";
import { RolesPage } from "./pom/RolesPage";
import { clickRowMenuItem } from "./pom/rowMenu";
import { Toasts } from "./pom/Toasts";
import { UsersPage } from "./pom/UsersPage";

// Scenarios: e2e/specs/shared/confirm-dialog.md (CONF-*), run once per dialog.

/** A viewset no other spec edits; it is customized with its own statements. */
const POLICY_VIEWSET = "content/ostree/summaries";

interface IFx {
  page: Page;
  api: PulpApi;
  cleanup: Cleanup;
}

interface ICtx {
  username: string;
  userId: number;
  group: string;
  groupId: number;
  role: string;
  /** The role assignment a "Remove role" dialog removes. */
  assignment: string;
  viewset: string;
}

interface IDialog {
  name: string;
  title: string;
  body: (ctx: ICtx) => string;
  confirm: "Delete" | "Remove" | "Reset";
  style: "danger" | "primary";
  /** The request confirming sends. */
  method: "DELETE" | "POST";
  seed: (fx: IFx) => Promise<ICtx>;
  open: (fx: IFx, ctx: ICtx) => Promise<ConfirmModal>;
  /** CONF-03: what confirming leads to (after the toast). */
  expectDone: (fx: IFx, ctx: ICtx) => Promise<void>;
  /** CONF-02: the object the dialog acts on is untouched. */
  expectUnchanged: (fx: IFx, ctx: ICtx) => Promise<void>;
  /** CONF-03 success toast. */
  toast: (ctx: ICtx) => string;
}

// --- Seeds -----------------------------------------------------------------

const blankCtx: ICtx = {
  username: "",
  userId: 0,
  group: "",
  groupId: 0,
  role: "",
  assignment: "",
  viewset: "",
};

const seedUser = async ({ api, cleanup }: IFx): Promise<ICtx> => {
  const username = cleanup.user(uniqueName("user"));
  const { id } = await api.createUser({ username });
  return { ...blankCtx, username, userId: id };
};

const seedGroup = async ({ api, cleanup }: IFx): Promise<ICtx> => {
  const group = cleanup.group(uniqueName("group"));
  const { id } = await api.createGroup(group);
  return { ...blankCtx, group, groupId: id };
};

const seedRole = async ({ api, cleanup }: IFx): Promise<ICtx> => {
  const role = cleanup.role(uniqueName("role"));
  await api.createRole({ name: role, permissions: ["core.view_task"] });
  return { ...blankCtx, role };
};

const seedMembership = async (fx: IFx): Promise<ICtx> => {
  const ctx = { ...(await seedUser(fx)), ...pickGroup(await seedGroup(fx)) };
  await fx.api.addGroupMember(ctx.group, ctx.username);
  return ctx;
};

const pickGroup = ({ group, groupId }: ICtx) => ({ group, groupId });

const seedUserRole = async (fx: IFx): Promise<ICtx> => {
  const ctx = { ...(await seedUser(fx)), role: (await seedRole(fx)).role };
  const { pulp_href } = await fx.api.assignRole(
    { user: ctx.username },
    { role: ctx.role },
  );
  return { ...ctx, assignment: pulp_href };
};

const seedGroupRole = async (fx: IFx): Promise<ICtx> => {
  const ctx = { ...(await seedGroup(fx)), role: (await seedRole(fx)).role };
  const { pulp_href } = await fx.api.assignRole(
    { group: ctx.group },
    { role: ctx.role },
  );
  return { ...ctx, assignment: pulp_href };
};

const seedPolicy = async ({ api, cleanup }: IFx): Promise<ICtx> => {
  cleanup.accessPolicy(POLICY_VIEWSET);
  const { statements } = await api.accessPolicy(POLICY_VIEWSET);
  // Any save marks a policy Customized; its own statements change no behaviour.
  await api.updateAccessPolicy(POLICY_VIEWSET, { statements });
  return { ...blankCtx, viewset: POLICY_VIEWSET };
};

// --- Openers ---------------------------------------------------------------

const openFromHeader = async (
  page: Page,
  { url, item, title }: { url: string; item: string; title: string },
): Promise<ConfirmModal> => {
  await page.goto(url);
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: item, exact: true }).click();
  return new ConfirmModal(page, title);
};

const openFromList = async (
  list: UsersPage | GroupsPage | RolesPage,
  { filter, name, title }: { filter: string; name: string; title: string },
): Promise<ConfirmModal> => {
  await list.goto();
  await list.filterBy(filter, name);
  await list.rowAction(name, "Delete");
  return new ConfirmModal(list.page, title);
};

/** A detail tab's table row, then its "Remove" item. */
const openFromTab = async (
  page: Page,
  {
    url,
    tab,
    grid,
    row,
    title,
  }: { url: string; tab?: RegExp; grid: string; row: string; title: string },
): Promise<ConfirmModal> => {
  await page.goto(url);
  if (tab) await page.getByRole("tab", { name: tab }).click();
  await clickRowMenuItem(
    tabRow(page, grid, row),
    page.getByRole("menuitem", { name: "Remove", exact: true }),
  );
  return new ConfirmModal(page, title);
};

const tabRow = (page: Page, grid: string, text: string): Locator =>
  page
    .getByRole("grid", { name: grid })
    .getByRole("row")
    .filter({ hasText: text });

const tab = (page: Page, label: string): Locator =>
  page.getByRole("tab", { name: new RegExp(`^${label} \\(\\d+\\)$`) });

// --- Dialogs ---------------------------------------------------------------

const DELETE_USER_BODY = ({ username }: ICtx) =>
  `Are you sure you want to delete "${username}"? This action cannot be undone.`;
const DELETE_GROUP_BODY = ({ group }: ICtx) =>
  `Are you sure you want to delete group "${group}"? This action cannot be undone.`;

const userStillThere = async ({ api }: IFx, { username }: ICtx) => {
  expect(await api.user(username)).toBeDefined();
};
const groupStillThere = async ({ api }: IFx, { group }: ICtx) => {
  expect(await api.group(group)).toBeDefined();
};

const deleteUserList: IDialog = {
  name: "Delete user (list)",
  title: "Delete User",
  body: DELETE_USER_BODY,
  confirm: "Delete",
  style: "danger",
  method: "DELETE",
  seed: seedUser,
  open: ({ page }, { username }) =>
    openFromList(new UsersPage(page), {
      filter: "Username",
      name: username,
      title: "Delete User",
    }),
  toast: ({ username }) => `User "${username}" deleted`,
  expectDone: async ({ page }, { username }) => {
    await new UsersPage(page).expectRowGone(username);
  },
  expectUnchanged: userStillThere,
};

const deleteUserDetail: IDialog = {
  ...deleteUserList,
  name: "Delete user (detail)",
  open: ({ page }, { userId }) =>
    openFromHeader(page, {
      url: `/admin/users/${userId}`,
      item: "Delete User",
      title: "Delete User",
    }),
  expectDone: async ({ page }, { username }) => {
    await expect(page).toHaveURL(/\/admin\/users$/);
    const users = new UsersPage(page);
    await users.filterBy("Username", username);
    await expect(users.row(username)).toHaveCount(0);
  },
};

const deleteGroupList: IDialog = {
  name: "Delete group (list)",
  title: "Delete Group",
  body: DELETE_GROUP_BODY,
  confirm: "Delete",
  style: "danger",
  method: "DELETE",
  seed: seedGroup,
  open: ({ page }, { group }) =>
    openFromList(new GroupsPage(page), {
      filter: "Name",
      name: group,
      title: "Delete Group",
    }),
  toast: ({ group }) => `Group "${group}" deleted`,
  expectDone: async ({ page }, { group }) => {
    await new GroupsPage(page).expectRowGone(group);
  },
  expectUnchanged: groupStillThere,
};

const deleteGroupDetail: IDialog = {
  ...deleteGroupList,
  name: "Delete group (detail)",
  open: ({ page }, { groupId }) =>
    openFromHeader(page, {
      url: `/admin/groups/${groupId}`,
      item: "Delete Group",
      title: "Delete Group",
    }),
  expectDone: async ({ page }, { group }) => {
    await expect(page).toHaveURL(/\/admin\/groups$/);
    const groups = new GroupsPage(page);
    await groups.filterBy("Name", group);
    await expect(groups.row(group)).toHaveCount(0);
  },
};

const deleteRole: IDialog = {
  name: "Delete role",
  title: "Delete Role",
  body: ({ role }) =>
    `Are you sure you want to delete the role "${role}"? This action cannot be undone.`,
  confirm: "Delete",
  style: "danger",
  method: "DELETE",
  seed: seedRole,
  open: ({ page }, { role }) =>
    openFromList(new RolesPage(page), {
      filter: "Name",
      name: role,
      title: "Delete Role",
    }),
  toast: ({ role }) => `Role "${role}" deleted`,
  expectDone: async ({ page }, { role }) => {
    await new RolesPage(page).expectRowGone(role);
  },
  expectUnchanged: async ({ api }, { role }) => {
    expect(await api.role(role)).toBeDefined();
  },
};

const MEMBERSHIP_BODY = ({ username, group }: ICtx) =>
  `Are you sure you want to remove user "${username}" from group "${group}"?`;

const memberStillThere = async ({ api }: IFx, { username, group }: ICtx) => {
  expect(await api.groupMemberNames(group)).toContain(username);
};

const removeGroupFromUser: IDialog = {
  name: "Remove group from user",
  title: "Remove Group",
  body: MEMBERSHIP_BODY,
  confirm: "Remove",
  style: "primary",
  method: "DELETE",
  seed: seedMembership,
  open: ({ page }, { userId, group }) =>
    openFromTab(page, {
      url: `/admin/users/${userId}`,
      grid: "User groups table",
      row: group,
      title: "Remove Group",
    }),
  toast: ({ username, group }) =>
    `User "${username}" removed from group "${group}"`,
  expectDone: async ({ page }, { group }) => {
    await expect(tabRow(page, "User groups table", group)).toHaveCount(0);
    await expect(tab(page, "Groups")).toHaveText("Groups (0)");
  },
  expectUnchanged: memberStillThere,
};

const removeUserFromGroup: IDialog = {
  name: "Remove user from group",
  title: "Remove User",
  body: MEMBERSHIP_BODY,
  confirm: "Remove",
  style: "primary",
  method: "DELETE",
  seed: seedMembership,
  open: ({ page }, { groupId, username }) =>
    openFromTab(page, {
      url: `/admin/groups/${groupId}`,
      grid: "Group users table",
      row: username,
      title: "Remove User",
    }),
  toast: removeGroupFromUser.toast,
  expectDone: async ({ page }, { username }) => {
    await expect(tabRow(page, "Group users table", username)).toHaveCount(0);
    await expect(tab(page, "Users")).toHaveText("Users (0)");
  },
  expectUnchanged: memberStillThere,
};

const assignmentStillThere =
  (kind: "user" | "group") =>
  async ({ api }: IFx, { username, group, role }: ICtx) => {
    const owner = kind === "user" ? { user: username } : { group };
    expect((await api.roleAssignments(owner)).map((a) => a.role)).toContain(
      role,
    );
  };

const removeRoleFromUser: IDialog = {
  name: "Remove role from user",
  title: "Remove Role",
  body: ({ role, username }) =>
    `Are you sure you want to remove role "${role}" from user "${username}"?`,
  confirm: "Remove",
  style: "primary",
  method: "DELETE",
  seed: seedUserRole,
  open: ({ page }, { userId, role }) =>
    openFromTab(page, {
      url: `/admin/users/${userId}`,
      tab: /^Roles \(\d+\)$/,
      grid: "User roles table",
      row: role,
      title: "Remove Role",
    }),
  toast: ({ role, username }) =>
    `Role "${role}" removed from user "${username}"`,
  expectDone: async ({ page }, { role }) => {
    await expect(tabRow(page, "User roles table", role)).toHaveCount(0);
    await expect(tab(page, "Roles")).toHaveText("Roles (0)");
  },
  expectUnchanged: assignmentStillThere("user"),
};

const removeRoleFromGroup: IDialog = {
  name: "Remove role from group",
  title: "Remove Role",
  body: ({ role, group }) =>
    `Are you sure you want to remove role "${role}" from group "${group}"?`,
  confirm: "Remove",
  style: "primary",
  method: "DELETE",
  seed: seedGroupRole,
  open: ({ page }, { groupId, role }) =>
    openFromTab(page, {
      url: `/admin/groups/${groupId}`,
      tab: /^Roles \(\d+\)$/,
      grid: "Group roles table",
      row: role,
      title: "Remove Role",
    }),
  toast: ({ role, group }) => `Role "${role}" removed from group "${group}"`,
  expectDone: async ({ page }, { role }) => {
    await expect(tabRow(page, "Group roles table", role)).toHaveCount(0);
    await expect(tab(page, "Roles")).toHaveText("Roles (0)");
  },
  expectUnchanged: assignmentStillThere("group"),
};

const resetPolicy: IDialog = {
  name: "Reset policy",
  title: "Reset access policy",
  body: ({ viewset }) =>
    `Restore "${viewset}" to its default? Your changes to it are lost.`,
  confirm: "Reset",
  style: "primary",
  method: "POST",
  seed: seedPolicy,
  open: async ({ page }, { viewset }) => {
    const policies = new AccessPoliciesPage(page);
    await policies.goto();
    await policies.find(viewset);
    return policies.openReset(viewset);
  },
  toast: ({ viewset }) => `Policy "${viewset}" reset to its default`,
  expectDone: async ({ page }, { viewset }) => {
    await expect(new AccessPoliciesPage(page).exactRow(viewset)).toContainText(
      "Default",
    );
  },
  expectUnchanged: async ({ api }, { viewset }) => {
    expect((await api.accessPolicy(viewset)).customized).toBe(true);
  },
};

const DIALOGS: IDialog[] = [
  deleteUserList,
  deleteUserDetail,
  deleteGroupList,
  deleteGroupDetail,
  deleteRole,
  removeGroupFromUser,
  removeUserFromGroup,
  removeRoleFromUser,
  removeRoleFromGroup,
  resetPolicy,
];

/** Reset policy tests share one server-wide record; they run in one serial block. */
const policyTests: (() => void)[] = [];

const forEachDialog = (body: (dialog: IDialog) => void): void => {
  for (const dialog of DIALOGS.filter((d) => d !== resetPolicy)) body(dialog);
  policyTests.push(() => body(resetPolicy));
};

// --- CONF-03: confirming (real backend) ------------------------------------

forEachDialog((dialog) => {
  test(`CONF-03 ${dialog.name}: confirming spins, then succeeds`, async ({
    page,
    api,
    cleanup,
    toasts,
  }) => {
    const fx = { page, api, cleanup };
    const ctx = await dialog.seed(fx);
    const modal = await dialog.open(fx, ctx);
    const slow = await delayApi(page, {
      url: (url) => url.pathname.startsWith("/api/pulp/"),
      method: dialog.method,
    });
    // While confirming, the button's name gains the spinner's "Loading..." label.
    const confirm = modal.dialog.getByRole("button", {
      name: new RegExp(`^(Loading\\.\\.\\. )?${dialog.confirm}$`),
    });
    await confirm.click();
    await expect(confirm.getByRole("progressbar")).toBeVisible();
    slow.release();
    // The released request still has to reach a possibly busy backend.
    await expect(modal.dialog).toBeHidden({ timeout: 15_000 });
    await expect(toasts.success(dialog.toast(ctx))).toBeVisible();
    await dialog.expectDone(fx, ctx);
  });
});

// --- CONF-04: failure keeps the dialog open ----------------------------------

/** The danger toast shows the fallback title and the server's reason. */
const expectFailure = async (
  toasts: Toasts,
  modal: ConfirmModal,
  { title, reason }: { title: string; reason: string | RegExp },
): Promise<void> => {
  await expect(toasts.danger(title)).toBeVisible();
  await expect(toasts.dangerBody(title)).toContainText(reason);
  await expect(modal.dialog).toBeVisible();
};

const GONE: {
  dialog: IDialog;
  trigger: string;
  remove: (api: PulpApi, ctx: ICtx) => Promise<void>;
  fallback: (ctx: ICtx) => string;
  reason: string | RegExp;
}[] = [
  {
    dialog: deleteUserList,
    trigger: "the user was deleted elsewhere",
    remove: (api, { username }) => api.deleteUser(username),
    fallback: ({ username }) => `Failed to delete user "${username}"`,
    reason: "No User matches the given query.",
  },
  {
    dialog: deleteUserDetail,
    trigger: "the user was deleted elsewhere",
    remove: (api, { username }) => api.deleteUser(username),
    fallback: ({ username }) => `Failed to delete user "${username}"`,
    reason: "No User matches the given query.",
  },
  {
    dialog: deleteRole,
    trigger: "the role was deleted elsewhere",
    remove: (api, { role }) => api.deleteRole(role),
    fallback: ({ role }) => `Failed to delete role "${role}"`,
    reason: "No Role matches the given query.",
  },
  {
    dialog: removeGroupFromUser,
    trigger: "the group was deleted elsewhere",
    remove: (api, { group }) => api.deleteGroup(group),
    fallback: ({ username, group }) =>
      `Failed to remove user "${username}" from group "${group}"`,
    reason: "No Group matches the given query.",
  },
  {
    dialog: removeRoleFromUser,
    trigger: "the assignment was removed elsewhere",
    remove: (api, { assignment }) => api.removeRoleAssignment(assignment),
    fallback: ({ role }) => `Failed to remove role "${role}"`,
    reason: /No .* matches the given query\./,
  },
  {
    dialog: removeRoleFromGroup,
    trigger: "the assignment was removed elsewhere",
    remove: (api, { assignment }) => api.removeRoleAssignment(assignment),
    fallback: ({ role }) => `Failed to remove role "${role}"`,
    reason: /No .* matches the given query\./,
  },
];

/**
 * Group rows: a second user holds view plus `perm` on the group through two
 * assignments, opens the dialog, and loses `perm` before confirming.
 */
const REVOKED: {
  dialog: string;
  perm: string;
  open: (page: Page, ctx: ICtx) => Promise<ConfirmModal>;
  fallback: (ctx: ICtx) => string;
}[] = [
  {
    dialog: "Delete group (list)",
    perm: "core.delete_group",
    open: (page, { group }) =>
      openFromList(new GroupsPage(page), {
        filter: "Name",
        name: group,
        title: "Delete Group",
      }),
    fallback: ({ group }) => `Failed to delete group "${group}"`,
  },
  {
    dialog: "Delete group (detail)",
    perm: "core.delete_group",
    open: (page, { groupId }) =>
      openFromHeader(page, {
        url: `/admin/groups/${groupId}`,
        item: "Delete Group",
        title: "Delete Group",
      }),
    fallback: ({ group }) => `Failed to delete group "${group}"`,
  },
  {
    dialog: "Remove user from group",
    perm: "core.change_group",
    open: (page, { groupId, username }) =>
      openFromTab(page, {
        url: `/admin/groups/${groupId}`,
        grid: "Group users table",
        row: username,
        title: "Remove User",
      }),
    fallback: ({ username, group }) =>
      `Failed to remove user "${username}" from group "${group}"`,
  },
];

test("CONF-04 a failure keeps the dialog open", async ({
  page,
  api,
  cleanup,
  toasts,
  secondUser,
}) => {
  // The "gone elsewhere" rows run as admin; the revoked-permission rows log a
  // second user in, so this test does many round-trips.
  test.slow();
  const fx = { page, api, cleanup };
  for (const row of GONE) {
    await test.step(`${row.dialog.name}: ${row.trigger}`, async () => {
      const ctx = await row.dialog.seed(fx);
      const modal = await row.dialog.open(fx, ctx);
      await row.remove(api, ctx);
      await modal.button(row.dialog.confirm).click();
      await expectFailure(toasts, modal, {
        title: row.fallback(ctx),
        reason: row.reason,
      });
    });
  }
  for (const row of REVOKED) {
    await test.step(`${row.dialog}: a revoked permission, then a retry succeeds`, async () => {
      // Seeds roles, logs a second user in, then confirms twice.
      const member = cleanup.user(uniqueName("user"));
      const group = cleanup.group(uniqueName("group"));
      const viewer = cleanup.role(uniqueName("role"));
      const granted = cleanup.role(uniqueName("role"));
      await api.createUser({ username: member });
      const { id: groupId, pulp_href: groupHref } =
        await api.createGroup(group);
      await api.addGroupMember(group, member);
      await api.createRole({ name: viewer, permissions: ["core.view_group"] });
      await api.createRole({ name: granted, permissions: [row.perm] });
      const user = await secondUser.create();
      const owner = { user: user.username };
      await api.assignRole(owner, { role: viewer, contentObject: groupHref });
      const grant = await api.assignRole(owner, {
        role: granted,
        contentObject: groupHref,
      });

      const secondPage = await secondUser.login(user);
      const secondToasts = new Toasts(secondPage);
      const ctx = { ...blankCtx, username: member, group, groupId };
      const modal = await row.open(secondPage, ctx);
      await expect(modal.dialog).toBeVisible();
      await api.removeRoleAssignment(grant.pulp_href);
      const confirm = modal.button(
        row.dialog.startsWith("Remove") ? "Remove" : "Delete",
      );
      await confirm.click();
      await expectFailure(secondToasts, modal, {
        title: row.fallback(ctx),
        reason: "You do not have permission to perform this action.",
      });

      await api.assignRole(owner, { role: granted, contentObject: groupHref });
      await confirm.click();
      await expect(modal.dialog).toBeHidden();
      await expect(secondToasts.success(/.*/)).not.toHaveCount(0);
    });
  }
});

// --- CONF-05: the object was already gone ------------------------------------

const CONF_05: {
  dialog: IDialog;
  change: string;
  apply: (api: PulpApi, ctx: ICtx) => Promise<void>;
  outcome: "danger" | "success";
  fallback: (ctx: ICtx) => string;
}[] = [
  {
    dialog: deleteUserList,
    change: "the user is deleted",
    apply: (api, { username }) => api.deleteUser(username),
    outcome: "danger",
    fallback: ({ username }) => `Failed to delete user "${username}"`,
  },
  {
    dialog: deleteGroupList,
    change: "the group is deleted",
    apply: (api, { group }) => api.deleteGroup(group),
    outcome: "danger",
    fallback: ({ group }) => `Failed to delete group "${group}"`,
  },
  {
    dialog: deleteRole,
    change: "the role is deleted",
    apply: (api, { role }) => api.deleteRole(role),
    outcome: "danger",
    fallback: ({ role }) => `Failed to delete role "${role}"`,
  },
  {
    dialog: removeGroupFromUser,
    change: "the group is deleted",
    apply: (api, { group }) => api.deleteGroup(group),
    outcome: "danger",
    fallback: ({ username, group }) =>
      `Failed to remove user "${username}" from group "${group}"`,
  },
  {
    dialog: removeUserFromGroup,
    change: "the user is removed from the group already",
    apply: (api, { group, username }) => api.removeGroupMember(group, username),
    outcome: "success",
    fallback: () => "",
  },
  {
    dialog: removeUserFromGroup,
    change: "the user is deleted",
    apply: (api, { username }) => api.deleteUser(username),
    outcome: "danger",
    fallback: ({ username, group }) =>
      `Failed to remove user "${username}" from group "${group}"`,
  },
  {
    dialog: removeRoleFromUser,
    change: "the assignment is removed",
    apply: (api, { assignment }) => api.removeRoleAssignment(assignment),
    outcome: "danger",
    fallback: ({ role }) => `Failed to remove role "${role}"`,
  },
  {
    dialog: removeRoleFromGroup,
    change: "the assignment is removed",
    apply: (api, { assignment }) => api.removeRoleAssignment(assignment),
    outcome: "danger",
    fallback: ({ role }) => `Failed to remove role "${role}"`,
  },
];

test("CONF-05 an object already gone yields the right toast", async ({
  page,
  api,
  cleanup,
  toasts,
}) => {
  // Each step seeds and acts on its own records, so it does many round-trips.
  test.slow();
  const fx = { page, api, cleanup };
  for (const row of CONF_05) {
    await test.step(`${row.dialog.name}: ${row.change} → ${row.outcome} toast`, async () => {
      const ctx = await row.dialog.seed(fx);
      const modal = await row.dialog.open(fx, ctx);
      await row.apply(api, ctx);
      await modal.button(row.dialog.confirm).click();
      if (row.outcome === "success") {
        await expect(modal.dialog).toBeHidden();
        await expect(toasts.success(row.dialog.toast(ctx))).toBeVisible();
      } else {
        await expectFailure(toasts, modal, {
          title: row.fallback(ctx),
          reason: /No .* matches the given query\./,
        });
      }
    });
  }
});

// --- CONF-06: no stale requests ----------------------------------------------

test("CONF-06 no request for the deleted object answers 404", async ({
  page,
  api,
  cleanup,
  toasts,
}) => {
  test.slow();
  const fx = { page, api, cleanup };
  for (const dialog of [deleteUserDetail, deleteGroupDetail]) {
    await test.step(`${dialog.name}: no request for the deleted object answers 404`, async () => {
      const ctx = await dialog.seed(fx);
      const modal = await dialog.open(fx, ctx);
      const notFound = recordApiNotFound(page);
      await modal.confirm(dialog.confirm);
      await expect(toasts.success(dialog.toast(ctx))).toBeVisible();
      await dialog.expectDone(fx, ctx);
      expect(notFound).toEqual([]);
    });
  }
});

test.describe("Reset policy", () => {
  test.describe.configure({ mode: "serial" });
  for (const define of policyTests) define();
});
