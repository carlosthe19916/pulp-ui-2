import type { Page } from "@playwright/test";

import { expect, test } from "../../../fixtures";
import type { PulpApi } from "../../../helpers/pulp-api";
import { STRONG_PASSWORD, uniqueName } from "../../../helpers/unique";
import {
  COL,
  cell,
  filledUser,
  groupId,
  openDetail,
} from "../../../helpers/users";
import { FormModal } from "../../../pom/FormModal";
import { UserDetailPage } from "../../../pom/UserDetailPage";
import type { UsersPage } from "../../../pom/UsersPage";

const openCreate = async (
  page: Page,
  usersPage: UsersPage,
): Promise<FormModal> => {
  await usersPage.goto();
  await page.getByRole("button", { name: "Create user", exact: true }).click();
  const modal = new FormModal(page, "Create User");
  await expect(modal.dialog).toBeVisible();
  return modal;
};

/** Non-GET requests to the users endpoints, to prove "nothing is sent". */
const recordUserWrites = (page: Page): string[] => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.url().includes("/users/")) {
      writes.push(`${request.method()} ${request.url()}`);
    }
  });
  return writes;
};

test.describe("Users", () => {
  // --- List ---------------------------------------------------------------

  const listRows = [
    { email: "alice@example.com", active: true, groups: 0 },
    { email: "alice@example.com", active: true, groups: 1 },
    { email: "alice@example.com", active: true, groups: 2 },
    { email: "alice@example.com", active: false, groups: 0 },
    { email: "alice@example.com", active: false, groups: 1 },
    { email: "alice@example.com", active: false, groups: 2 },
    { email: "", active: true, groups: 0 },
    { email: "", active: true, groups: 1 },
    { email: "", active: true, groups: 2 },
    { email: "", active: false, groups: 0 },
    { email: "", active: false, groups: 1 },
    { email: "", active: false, groups: 2 },
  ];
  test("USR-LIST-01 row content", async ({ usersPage, api, cleanup }) => {
    // Seed every row once (in parallel), then assert each on a single page load.
    const seeded = await Promise.all(
      listRows.map(async (row) => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({
          username,
          email: row.email,
          is_active: row.active,
        });
        for (let i = 0; i < row.groups; i++) {
          const group = cleanup.group(uniqueName("group"));
          await api.createGroup(group);
          await api.addGroupMember(group, username);
        }
        return { row, username };
      }),
    );

    await usersPage.goto();
    for (const { row, username } of seeded) {
      await test.step(`email ${row.email || "(none)"}, ${row.active ? "active" : "inactive"}, ${row.groups} groups`, async () => {
        await usersPage.list.filter("Username", username);
        const tr = usersPage.list.row(username);
        await expect(cell(tr, COL.email)).toHaveText(row.email || "—");
        await expect(cell(tr, COL.active)).toHaveText(
          row.active ? "Active" : "Inactive",
        );
        await expect(cell(tr, COL.groups)).toHaveText(String(row.groups));
        // Formatted for people, never the raw ISO timestamp.
        await expect(cell(tr, COL.dateJoined)).not.toHaveText(/^—$|T\d\d:/);
      });
    }
  });

  test("USR-LIST-02 row actions Edit and Delete are enabled", async ({
    usersPage,
    api,
    cleanup,
    page,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    await usersPage.goto();
    await usersPage.list.filter("Username", username);
    await usersPage
      .row(username)
      .getByRole("button", { name: "Kebab toggle" })
      .click();
    for (const item of ["Edit", "Delete"]) {
      const menuItem = page.getByRole("menuitem", { name: item, exact: true });
      await expect(menuItem).toBeVisible();
      await expect(menuItem).not.toHaveAttribute("aria-disabled", "true");
    }
  });

  test("USR-LIST-03 a non-superuser gets 403", async ({ secondUser }) => {
    test.slow(); // logs in a second user per step
    for (const staff of [false, true]) {
      await test.step(`${staff ? "with" : "without"} Staff status`, async () => {
        const user = await secondUser.create({ is_staff: staff });
        const page = await secondUser.login(user);
        await page.goto("/admin/users");
        const grid = page.getByRole("grid", { name: "Users table" });
        await expect(
          grid.getByRole("heading", { name: "403: Access denied" }),
        ).toBeVisible();
        await expect(
          grid.getByRole("button", { name: "Kebab toggle" }),
        ).toHaveCount(0);
      });
    }
  });

  test("USR-LIST-04 Create user is enabled for a non-superuser and fails with the server's reason", async ({
    secondUser,
  }) => {
    const user = await secondUser.create();
    const page = await secondUser.login(user);
    await page.goto("/admin/users");
    const create = page.getByRole("button", {
      name: "Create user",
      exact: true,
    });
    await expect(create).toBeEnabled();
    await create.click();
    const modal = new FormModal(page, "Create User");
    await modal.field("Username").fill(uniqueName("user"));
    await modal.field("Password").fill(STRONG_PASSWORD);
    await modal.button("Create").click();
    await expect(modal.submitError()).toHaveAccessibleName(
      "Danger alert: Failed to create user",
    );
    await expect(modal.dialog).toContainText(
      "You do not have permission to perform this action.",
    );
  });

  // --- Create -------------------------------------------------------------

  // USR-CRE-01 (form fields and defaults) is a component test:
  // client/src/app/components/UserModal/UserModal.test.tsx.
  // USR-CRE-02/03/04 (username / password / email rules) are contract tests:
  // tests/admin/users/users.api.spec.ts (server rules) + the modal component test (client
  // validation). The UI create happy-path is covered by USR-CRE-07 below.

  // Both status labels and both staff values in two cases, not the 4-way product.
  test("USR-CRE-05 Active and Staff status are saved", async ({
    page,
    usersPage,
    api,
    cleanup,
  }) => {
    for (const { active, staff } of [
      { active: true, staff: false },
      { active: false, staff: true },
    ]) {
      await test.step(`Active ${active ? "checked" : "unchecked"}, Staff ${staff ? "checked" : "unchecked"}`, async () => {
        const username = cleanup.user(uniqueName("user"));
        const modal = await openCreate(page, usersPage);
        await modal.field("Username").fill(username);
        await modal.field("Password").fill(STRONG_PASSWORD);
        await modal.checkbox("Active").setChecked(active);
        await modal.checkbox("Staff status").setChecked(staff);
        await modal.button("Create").click();
        await modal.expectClosed();
        await usersPage.list.filter("Username", username);
        await expect(cell(usersPage.list.row(username), COL.active)).toHaveText(
          active ? "Active" : "Inactive",
        );
        const saved = await api.user(username);
        expect(saved?.is_active).toBe(active);
        expect(saved?.is_staff).toBe(staff);
      });
    }
  });

  // Main cases of the independent optional fields, not the full 8-way product.
  test("USR-CRE-06 optional text fields are saved", async ({
    page,
    usersPage,
    api,
    cleanup,
  }) => {
    const label = (on: boolean) => (on ? "filled" : "empty");
    for (const { email, first, last } of [
      { email: false, first: false, last: false },
      { email: true, first: true, last: true },
      { email: true, first: false, last: false },
    ]) {
      await test.step(`email ${label(email)}, first ${label(first)}, last ${label(last)}`, async () => {
        const username = cleanup.user(uniqueName("user"));
        const expected = {
          email: email ? "ada@example.com" : "",
          first_name: first ? "Ada" : "",
          last_name: last ? "Lovelace" : "",
        };
        const modal = await openCreate(page, usersPage);
        await modal.field("Username").fill(username);
        await modal.field("Password").fill(STRONG_PASSWORD);
        await modal.field("Email").fill(expected.email);
        await modal.field("First name").fill(expected.first_name);
        await modal.field("Last name").fill(expected.last_name);
        await modal.button("Create").click();
        await modal.expectClosed();
        await expect.poll(() => api.user(username)).toMatchObject(expected);
      });
    }
  });

  test(
    "USR-CRE-07 the new user appears with a toast and Groups 0",
    { tag: "@smoke" },
    async ({ page, usersPage, cleanup, toasts }) => {
      const username = cleanup.user(uniqueName("user"));
      const modal = await openCreate(page, usersPage);
      await modal.field("Username").fill(username);
      await modal.field("Password").fill(STRONG_PASSWORD);
      await modal.button("Create").click();
      await expect(toasts.success(`User "${username}" created`)).toBeVisible();
      await usersPage.list.filter("Username", username);
      await expect(cell(usersPage.list.row(username), COL.groups)).toHaveText(
        "0",
      );
    },
  );

  test("USR-CRE-08 a user created active can log in and inactive cannot", async ({
    page,
    usersPage,
    cleanup,
    secondUser,
  }) => {
    test.slow(); // creates a user and logs in a second user per step
    for (const active of [true, false]) {
      await test.step(`created ${active ? "active" : "inactive"} ${active ? "can" : "cannot"} log in`, async () => {
        const username = cleanup.user(uniqueName("user"));
        const modal = await openCreate(page, usersPage);
        await modal.field("Username").fill(username);
        await modal.field("Password").fill(STRONG_PASSWORD);
        await modal.checkbox("Active").setChecked(active);
        await modal.button("Create").click();
        await modal.expectClosed();

        const credentials = { username, password: STRONG_PASSWORD };
        if (active) {
          await secondUser.login(credentials);
        } else {
          const userPage = await secondUser.attemptLogin(credentials);
          await expect(
            userPage.getByText("Invalid login credentials."),
          ).toBeVisible();
        }
      });
    }
  });

  // --- Edit ---------------------------------------------------------------

  test("USR-EDT-01 form fields from each entry point", async ({
    page,
    usersPage,
    api,
    cleanup,
  }) => {
    test.slow();
    for (const entry of ["list", "detail"] as const) {
      await test.step(`from ${entry}`, async () => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({ username, ...filledUser, is_staff: true });
        let modal: FormModal;
        if (entry === "list") {
          await usersPage.goto();
          modal = await usersPage.openEdit(username);
        } else {
          modal = await (
            await openDetail(page, api, username)
          ).openEdit(username);
        }
        await expect(modal.field("Email")).toHaveValue(filledUser.email);
        await expect(modal.field("First name")).toHaveValue(
          filledUser.first_name,
        );
        await expect(modal.field("Last name")).toHaveValue(
          filledUser.last_name,
        );
        await expect(modal.checkbox("Active")).toBeChecked();
        await expect(modal.checkbox("Staff status")).toBeChecked();
        await expect(modal.field("Username")).toHaveCount(0);
        await expect(modal.field("Password")).toHaveCount(0);
        await expect(modal.button("Save")).toBeVisible();
      });
    }
  });

  const textFields = [
    { label: "Email", key: "email", value: "after@example.com" },
    { label: "First name", key: "first_name", value: "After" },
    { label: "Last name", key: "last_name", value: "Changed" },
  ] as const;

  /** Open the edit modal from the list or the detail page. */
  const openEdit = async ({
    entry,
    page,
    usersPage,
    api,
    username,
  }: {
    entry: "list" | "detail";
    page: Page;
    usersPage: UsersPage;
    api: PulpApi;
    username: string;
  }): Promise<FormModal> => {
    if (entry === "list") {
      await usersPage.goto();
      return usersPage.openEdit(username);
    }
    return (await openDetail(page, api, username)).openEdit(username);
  };

  test("USR-EDT-02 change a field from each entry point", async ({
    page,
    usersPage,
    api,
    cleanup,
    toasts,
  }) => {
    test.slow();
    for (const field of textFields) {
      for (const entry of ["list", "detail"] as const) {
        await test.step(`change ${field.label} from ${entry}`, async () => {
          const username = cleanup.user(uniqueName("user"));
          await api.createUser({ username, ...filledUser });
          const modal = await openEdit({
            entry,
            page,
            usersPage,
            api,
            username,
          });
          await modal.field(field.label).fill(field.value);
          await modal.button("Save").click();
          await modal.expectClosed();
          await expect(
            toasts.success(`User "${username}" updated`),
          ).toBeVisible();
          await expect
            .poll(() => api.user(username))
            .toMatchObject({
              ...filledUser,
              [field.key]: field.value,
            });

          // The new value shows in the Users list (Email is its only text
          // column) and in the detail page's edit form, without a reload.
          await usersPage.goto();
          await usersPage.list.filter("Username", username);
          await expect(
            cell(usersPage.list.row(username), COL.email),
          ).toHaveText(field.key === "email" ? field.value : filledUser.email);
          const detail = await (async () => {
            await usersPage.openDetail(username);
            return new UserDetailPage(page, username);
          })();
          const again = await detail.openEdit(username);
          await expect(again.field(field.label)).toHaveValue(field.value);
        });
      }
    }
  });

  const multiRows: {
    label: string;
    changes: Record<string, string | boolean>;
  }[] = [
    {
      label: "Email, First name",
      changes: { Email: "m@example.com", "First name": "M" },
    },
    {
      label: "Email, Last name",
      changes: { Email: "m@example.com", "Last name": "M" },
    },
    {
      label: "First name, Last name",
      changes: { "First name": "M", "Last name": "N" },
    },
    {
      label: "Email, First name, Last name",
      changes: { Email: "m@example.com", "First name": "M", "Last name": "N" },
    },
    {
      label: "Email, Active",
      changes: { Email: "m@example.com", Active: false },
    },
    {
      label: "First name, Staff status",
      changes: { "First name": "M", "Staff status": true },
    },
    {
      label: "every field",
      changes: {
        Email: "m@example.com",
        "First name": "M",
        "Last name": "N",
        Active: false,
        "Staff status": true,
      },
    },
  ];
  const keyOf: Record<string, string> = {
    Email: "email",
    "First name": "first_name",
    "Last name": "last_name",
    Active: "is_active",
    "Staff status": "is_staff",
  };
  test("USR-EDT-03 change multiple fields at once", async ({
    usersPage,
    api,
    cleanup,
  }) => {
    test.slow();
    for (const row of multiRows) {
      await test.step(`change ${row.label}`, async () => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({ username, ...filledUser });
        await usersPage.goto();
        const modal = await usersPage.openEdit(username);
        const expected: Record<string, string | boolean> = { ...filledUser };
        for (const [label, value] of Object.entries(row.changes)) {
          if (typeof value === "boolean") {
            await modal.checkbox(label).setChecked(value);
          } else {
            await modal.field(label).fill(value);
          }
          expected[keyOf[label]] = value;
        }
        await modal.button("Save").click();
        await modal.expectClosed();
        await expect.poll(() => api.user(username)).toMatchObject(expected);
      });
    }
  });

  // Representative transitions that flip each independent flag both ways, rather
  // than all 12 combinations.
  const transitions: [boolean, boolean, boolean, boolean][] = [
    [true, false, false, false],
    [false, false, true, true],
    [true, true, false, false],
    [false, true, true, false],
  ];
  const onOff = (on: boolean) => (on ? "on" : "off");
  test("USR-EDT-04 Active and Staff transitions", async ({
    usersPage,
    api,
    cleanup,
  }) => {
    test.slow();
    for (const [fromActive, fromStaff, toActive, toStaff] of transitions) {
      await test.step(`Active ${onOff(fromActive)}→${onOff(toActive)}, Staff ${onOff(fromStaff)}→${onOff(toStaff)}`, async () => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({
          username,
          is_active: fromActive,
          is_staff: fromStaff,
        });
        await usersPage.goto();
        const modal = await usersPage.openEdit(username);
        await modal.checkbox("Active").setChecked(toActive);
        await modal.checkbox("Staff status").setChecked(toStaff);
        await modal.button("Save").click();
        await modal.expectClosed();
        await expect(cell(usersPage.list.row(username), COL.active)).toHaveText(
          toActive ? "Active" : "Inactive",
        );
        await expect
          .poll(() => api.user(username))
          .toMatchObject({ is_active: toActive, is_staff: toStaff });
      });
    }
  });

  test("USR-EDT-05 clearing a field", async ({ usersPage, api, cleanup }) => {
    test.slow();
    for (const field of textFields) {
      await test.step(`clearing ${field.label}`, async () => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({ username, ...filledUser });
        await usersPage.goto();
        const modal = await usersPage.openEdit(username);
        await modal.field(field.label).fill("");
        await modal.button("Save").click();
        await modal.expectClosed();
        await expect
          .poll(async () => (await api.user(username))?.[field.key])
          .toBe("");
        if (field.key === "email") {
          await expect(
            cell(usersPage.list.row(username), COL.email),
          ).toHaveText("—");
        }
      });
    }
  });

  test("USR-EDT-06 invalid email on edit shows an error and sends nothing", async ({
    page,
    usersPage,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username, ...filledUser });
    await usersPage.goto();
    const modal = await usersPage.openEdit(username);
    const writes = recordUserWrites(page);
    await modal.field("Email").fill("not-an-email");
    await expect(modal.dialog.getByText("Invalid email address")).toBeVisible();
    await modal.button("Save").click();
    await expect(modal.dialog).toBeVisible();
    expect(writes).toEqual([]);
  });

  test("USR-EDT-07 saving without changes shows the toast and changes nothing", async ({
    usersPage,
    api,
    cleanup,
    toasts,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username, ...filledUser });
    await usersPage.goto();
    const modal = await usersPage.openEdit(username);
    await modal.button("Save").click();
    await modal.expectClosed();
    await expect(toasts.success(`User "${username}" updated`)).toBeVisible();
    expect(await api.user(username)).toMatchObject(filledUser);
  });

  test("USR-EDT-08 deactivating stops login and reactivating restores it", async ({
    usersPage,
    secondUser,
  }) => {
    const user = await secondUser.create();
    await secondUser.login(user);

    await usersPage.goto();
    let modal = await usersPage.openEdit(user.username);
    await modal.checkbox("Active").uncheck();
    await modal.button("Save").click();
    await modal.expectClosed();
    const rejected = await secondUser.attemptLogin(user);
    await expect(
      rejected.getByText("Invalid login credentials."),
    ).toBeVisible();

    modal = await usersPage.openEdit(user.username);
    await modal.checkbox("Active").check();
    await modal.button("Save").click();
    await modal.expectClosed();
    await secondUser.login(user);
  });

  test("USR-EDT-09 Staff status does not grant the admin pages", async ({
    secondUser,
  }) => {
    const user = await secondUser.create({ is_staff: true });
    const page = await secondUser.login(user);
    for (const [path, grid] of [
      ["/admin/users", "Users table"],
      ["/admin/roles", "Roles table"],
      ["/admin/access-policies", "Access policies table"],
    ]) {
      await page.goto(path);
      await expect(
        page
          .getByRole("grid", { name: grid })
          .getByRole("heading", { name: "403: Access denied" }),
      ).toBeVisible();
    }
  });

  // --- Delete -------------------------------------------------------------

  const deleteRows = [
    { memberships: "no groups, no roles", entry: "list" },
    { memberships: "no groups, no roles", entry: "detail" },
    { memberships: "in two groups", entry: "list" },
    { memberships: "in two groups", entry: "detail" },
    { memberships: "with global and object roles", entry: "list" },
    { memberships: "with global and object roles", entry: "detail" },
  ] as const;
  test("USR-DEL-01 delete a user", async ({
    page,
    usersPage,
    api,
    cleanup,
    toasts,
  }) => {
    test.slow();
    for (const row of deleteRows) {
      await test.step(`${row.memberships} from ${row.entry}`, async () => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({ username });
        const groups: string[] = [];
        let repositoryHref = "";
        if (row.memberships === "in two groups") {
          // Each group keeps another member, so its count drops from 2 to 1.
          const other = cleanup.user(uniqueName("user"));
          await api.createUser({ username: other });
          for (let i = 0; i < 2; i++) {
            const group = cleanup.group(uniqueName("group"));
            await api.createGroup(group);
            await api.addGroupMember(group, username);
            await api.addGroupMember(group, other);
            groups.push(group);
          }
        }
        if (row.memberships === "with global and object roles") {
          const role = cleanup.role(uniqueName("role"));
          await api.createRole({ name: role, permissions: ["core.view_task"] });
          await api.assignRole({ user: username }, { role });
          const repository = cleanup.repository(uniqueName("repo"));
          repositoryHref = (await api.createFileRepository(repository))
            .pulp_href;
          await api.assignRole(
            { user: username },
            {
              role: "file.filerepository_viewer",
              contentObject: repositoryHref,
            },
          );
        }

        if (row.entry === "list") {
          await usersPage.goto();
          await usersPage.list.filter("Username", username);
          await usersPage.delete(username);
          await usersPage.expectRowGone(username);
        } else {
          const detail = await openDetail(page, api, username);
          await detail.deleteUser();
          await expect(page).toHaveURL(/\/admin\/users$/);
        }
        await expect(
          toasts.success(`User "${username}" deleted`),
        ).toBeVisible();
        await expect.poll(() => api.user(username)).toBeUndefined();

        for (const group of groups) {
          await page.goto(`/admin/groups/${await groupId(api, group)}`);
          await expect(
            page.getByRole("tab", { name: "Users (1)" }),
          ).toBeVisible();
          await expect(
            page
              .getByRole("grid", { name: "Group users table" })
              .getByRole("link", { name: username, exact: true }),
          ).toHaveCount(0);
        }
        if (repositoryHref) {
          const { roles } = await api.getJson<{
            roles: { role: string; users: string[] }[];
          }>(`${repositoryHref}list_roles/`);
          expect(roles.flatMap((r) => r.users)).not.toContain(username);
        }
      });
    }
  });

  test("USR-DEL-02 deleting the logged-in user", () => {
    test.skip(
      true,
      "Manual: Pulp's API can't create a second superuser (is_superuser is ignored)",
    );
  });

  test("USR-DEL-03 a deleted user's URL shows 404", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const { id } = await api.createUser({ username });
    await api.deleteUser(username);
    await page.goto(`/admin/users/${id}`);
    await expect(page.getByText("404: That page does not exist")).toBeVisible();
  });
});
