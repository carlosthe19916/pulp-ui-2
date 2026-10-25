import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import type { PulpApi } from "./helpers/pulp-api";
import { STRONG_PASSWORD, uniqueName } from "./helpers/unique";
import { BatchAddModal } from "./pom/BatchAddModal";
import { FormModal } from "./pom/FormModal";
import { UserDetailPage } from "./pom/UserDetailPage";
import type { UsersPage } from "./pom/UsersPage";

// Users table columns, in order (LIST-01).
const COL = { email: 1, active: 2, groups: 3, dateJoined: 4 } as const;

const cell = (row: Locator, column: number): Locator =>
  row.getByRole("gridcell").nth(column);

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

const userId = async (api: PulpApi, username: string): Promise<number> => {
  const user = await api.user(username);
  if (!user) throw new Error(`No user ${username}`);
  return user.id;
};

const groupId = async (api: PulpApi, name: string): Promise<number> => {
  const group = await api.group(name);
  if (!group) throw new Error(`No group ${name}`);
  return group.id;
};

/** Open the user's detail page directly. */
const openDetail = async (
  page: Page,
  api: PulpApi,
  username: string,
): Promise<UserDetailPage> => {
  const detail = new UserDetailPage(page, username);
  await detail.goto(await userId(api, username));
  return detail;
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

  for (const staff of [false, true]) {
    test(`USR-LIST-03 a non-superuser ${staff ? "with" : "without"} Staff status gets 403`, async ({
      secondUser,
    }) => {
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

  type Outcome =
    { created: string } | { clientError: string } | { serverError: string };

  const usernameRows: {
    label: string;
    make: (base: string) => string;
    seed?: (base: string) => string;
    outcome: (base: string) => Outcome;
  }[] = [
    // Client "required" validation is a component test; these are the main
    // real-backend outcomes: created, trimmed, accepted characters, and the
    // server's own rejections.
    {
      label: "a new, simple name",
      make: (base) => base,
      outcome: (base) => ({ created: base }),
    },
    {
      label: "with spaces around it",
      make: (base) => `  ${base}  `,
      outcome: (base) => ({ created: base }),
    },
    {
      label: "with symbols, spaces and unicode",
      make: (base) => `${base}.b-c_d é/f`,
      outcome: (base) => ({ created: `${base}.b-c_d é/f` }),
    },
    {
      label: "only spaces",
      make: () => "        ",
      outcome: () => ({ serverError: "This field may not be blank." }),
    },
    {
      label: "an existing username",
      make: (base) => base,
      seed: (base) => base,
      outcome: () => ({ serverError: "This field must be unique." }),
    },
    {
      label: "151 characters",
      make: (base) => base.padEnd(151, "x"),
      outcome: () => ({
        serverError: "Ensure this field has no more than 150 characters.",
      }),
    },
  ];

  /** Submit the create form and check one Outcome. */
  const expectOutcome = async ({
    page,
    modal,
    outcome,
    writes,
    api,
    toasts,
  }: {
    page: Page;
    modal: FormModal;
    outcome: Outcome;
    writes: string[];
    api: PulpApi;
    toasts: { success: (title: string) => Locator };
  }): Promise<void> => {
    await modal.button("Create").click();
    if ("created" in outcome) {
      await modal.expectClosed();
      await expect(
        toasts.success(`User "${outcome.created}" created`),
      ).toBeVisible();
      await expect.poll(() => api.user(outcome.created)).toBeTruthy();
    } else if ("clientError" in outcome) {
      await expect(modal.dialog.getByText(outcome.clientError)).toBeVisible();
      await expect(modal.dialog).toBeVisible();
      expect(writes).toEqual([]);
    } else {
      await modal.expectSubmitError(outcome.serverError);
      await expect(modal.dialog).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /^Success alert/ }),
      ).toHaveCount(0);
    }
  };

  for (const row of usernameRows) {
    test(`USR-CRE-02 username "${row.label}"`, async ({
      page,
      usersPage,
      api,
      cleanup,
      toasts,
    }) => {
      const base = uniqueName("user");
      const outcome = row.outcome(base);
      if (row.seed) {
        await api.createUser({ username: cleanup.user(row.seed(base)) });
      }
      if ("created" in outcome) cleanup.user(outcome.created);

      const modal = await openCreate(page, usersPage);
      const writes = recordUserWrites(page);
      await modal.field("Username").fill(row.make(base));
      await modal.field("Password").fill(STRONG_PASSWORD);
      await expectOutcome({ page, modal, outcome, writes, api, toasts });
    });
  }

  const passwordRows: {
    label: string;
    make: (username: string) => string;
    outcome: Outcome | "created";
  }[] = [
    // Client "required" / "min length" validation is a component test; these are
    // the real-backend outcomes (a valid password, and the server's own rules).
    {
      label: "8 characters, strong",
      make: () => "Qz7!pLm2",
      outcome: "created",
    },
    {
      label: "8 characters, common",
      make: () => "password",
      outcome: { serverError: "This password is too common." },
    },
    {
      label: "8 digits",
      make: () => "12345678",
      outcome: { serverError: "This password is entirely numeric." },
    },
    {
      label: "only spaces, 8 long",
      make: () => "        ",
      outcome: { serverError: "This field may not be blank." },
    },
  ];
  for (const row of passwordRows) {
    test(`USR-CRE-03 password "${row.label}"`, async ({
      page,
      usersPage,
      api,
      cleanup,
      toasts,
    }) => {
      const username = cleanup.user(uniqueName("user"));
      const modal = await openCreate(page, usersPage);
      const writes = recordUserWrites(page);
      await modal.field("Username").fill(username);
      await modal.field("Password").fill(row.make(username));
      // The password input hides what is typed.
      await expect(modal.field("Password")).toHaveAttribute("type", "password");
      const outcome =
        row.outcome === "created" ? { created: username } : row.outcome;
      await expectOutcome({ page, modal, outcome, writes, api, toasts });
    });
  }

  const emailRows: {
    email: string;
    label?: string;
    outcome: "created" | Outcome;
    duplicate?: boolean;
  }[] = [
    // Client "invalid format" validation is a component test; these are the
    // real-backend outcomes (what the server stores or rejects).
    { email: "", label: "(empty)", outcome: "created" },
    { email: "alice@example.com", outcome: "created" },
    {
      email: "alice@example",
      outcome: { serverError: "Enter a valid email address." },
    },
    { email: "alice@localhost", outcome: "created" },
    {
      email: "e2e-shared@example.com",
      label: "an email already used",
      outcome: "created",
      duplicate: true,
    },
  ];
  for (const row of emailRows) {
    test(`USR-CRE-04 email "${row.label ?? row.email}"`, async ({
      page,
      usersPage,
      api,
      cleanup,
      toasts,
    }) => {
      if (row.duplicate) {
        await api.createUser({
          username: cleanup.user(uniqueName("user")),
          email: row.email,
        });
      }
      const username = cleanup.user(uniqueName("user"));
      const modal = await openCreate(page, usersPage);
      const writes = recordUserWrites(page);
      await modal.field("Username").fill(username);
      await modal.field("Password").fill(STRONG_PASSWORD);
      await modal.field("Email").fill(row.email);
      const outcome =
        row.outcome === "created" ? { created: username } : row.outcome;
      await expectOutcome({ page, modal, outcome, writes, api, toasts });
      if (row.outcome === "created") {
        await expect
          .poll(async () => (await api.user(username))?.email)
          .toBe(row.email);
        await usersPage.list.filter("Username", username);
        await expect(cell(usersPage.list.row(username), COL.email)).toHaveText(
          row.email || "—",
        );
      }
    });
  }

  // Both status labels and both staff values in two cases, not the 4-way product.
  for (const { active, staff } of [
    { active: true, staff: false },
    { active: false, staff: true },
  ]) {
    test(`USR-CRE-05 Active ${active ? "checked" : "unchecked"}, Staff status ${staff ? "checked" : "unchecked"}`, async ({
      page,
      usersPage,
      api,
      cleanup,
    }) => {
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

  // Main cases of the independent optional fields, not the full 8-way product.
  for (const { email, first, last } of [
    { email: false, first: false, last: false },
    { email: true, first: true, last: true },
    { email: true, first: false, last: false },
  ]) {
    const label = (on: boolean) => (on ? "filled" : "empty");
    test(`USR-CRE-06 email ${label(email)}, first ${label(first)}, last ${label(last)}`, async ({
      page,
      usersPage,
      api,
      cleanup,
    }) => {
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

  for (const active of [true, false]) {
    test(`USR-CRE-08 a user created ${active ? "active" : "inactive"} ${active ? "can" : "cannot"} log in`, async ({
      page,
      usersPage,
      cleanup,
      secondUser,
    }) => {
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

  // --- Edit ---------------------------------------------------------------

  const filledUser = {
    email: "before@example.com",
    first_name: "Before",
    last_name: "Person",
    is_active: true,
    is_staff: false,
  };

  for (const entry of ["list", "detail"] as const) {
    test(`USR-EDT-01 form fields from ${entry}`, async ({
      page,
      usersPage,
      api,
      cleanup,
    }) => {
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
      await expect(modal.field("Last name")).toHaveValue(filledUser.last_name);
      await expect(modal.checkbox("Active")).toBeChecked();
      await expect(modal.checkbox("Staff status")).toBeChecked();
      await expect(modal.field("Username")).toHaveCount(0);
      await expect(modal.field("Password")).toHaveCount(0);
      await expect(modal.button("Save")).toBeVisible();
    });
  }

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

  for (const field of textFields) {
    for (const entry of ["list", "detail"] as const) {
      test(`USR-EDT-02 change ${field.label} from ${entry}`, async ({
        page,
        usersPage,
        api,
        cleanup,
        toasts,
      }) => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({ username, ...filledUser });
        const modal = await openEdit({ entry, page, usersPage, api, username });
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

        // The new value shows in the Users list (Email is its only text column)
        // and in the detail page's edit form, without a reload.
        await usersPage.goto();
        await usersPage.list.filter("Username", username);
        await expect(cell(usersPage.list.row(username), COL.email)).toHaveText(
          field.key === "email" ? field.value : filledUser.email,
        );
        const detail = await (async () => {
          await usersPage.openDetail(username);
          return new UserDetailPage(page, username);
        })();
        const again = await detail.openEdit(username);
        await expect(again.field(field.label)).toHaveValue(field.value);
      });
    }
  }

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
  for (const row of multiRows) {
    test(`USR-EDT-03 change ${row.label}`, async ({
      usersPage,
      api,
      cleanup,
    }) => {
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

  // Representative transitions that flip each independent flag both ways, rather
  // than all 12 combinations.
  const transitions: [boolean, boolean, boolean, boolean][] = [
    [true, false, false, false],
    [false, false, true, true],
    [true, true, false, false],
    [false, true, true, false],
  ];
  const onOff = (on: boolean) => (on ? "on" : "off");
  for (const [fromActive, fromStaff, toActive, toStaff] of transitions) {
    test(`USR-EDT-04 Active ${onOff(fromActive)}→${onOff(toActive)}, Staff ${onOff(fromStaff)}→${onOff(toStaff)}`, async ({
      usersPage,
      api,
      cleanup,
    }) => {
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

  for (const field of textFields) {
    test(`USR-EDT-05 clearing ${field.label}`, async ({
      usersPage,
      api,
      cleanup,
    }) => {
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
        await expect(cell(usersPage.list.row(username), COL.email)).toHaveText(
          "—",
        );
      }
    });
  }

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
  for (const row of deleteRows) {
    test(`USR-DEL-01 delete a user ${row.memberships} from ${row.entry}`, async ({
      page,
      usersPage,
      api,
      cleanup,
      toasts,
    }) => {
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
        repositoryHref = (await api.createFileRepository(repository)).pulp_href;
        await api.assignRole(
          { user: username },
          { role: "file.filerepository_viewer", contentObject: repositoryHref },
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
      await expect(toasts.success(`User "${username}" deleted`)).toBeVisible();
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

  // --- Detail page --------------------------------------------------------

  test("USR-DET-01 header, actions and tabs", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    const detail = await openDetail(page, api, username);
    await expect(detail.title).toBeVisible();
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Edit User", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Delete User", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tab", { name: "Groups (0)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tab", { name: "Roles (0)" })).toBeVisible();
  });

  test.describe("USR-DET-02 tab counts", () => {
    // Twelve groups and roles, more than a page, shared by every row.
    const seededGroups = Array.from({ length: 12 }, () => uniqueName("group"));
    const seededRoles = Array.from({ length: 12 }, () => uniqueName("role"));

    // Seeding and removing 24 records outlasts the default hook timeout.
    test.beforeAll(async ({ api }) => {
      test.setTimeout(120_000);
      await Promise.all([
        ...seededGroups.map((group) => api.createGroup(group)),
        ...seededRoles.map((role) => api.createRole({ name: role })),
      ]);
    });

    test.afterAll(async ({ api }) => {
      test.setTimeout(120_000);
      await Promise.all([
        ...seededGroups.map((group) => api.deleteGroup(group)),
        ...seededRoles.map((role) => api.deleteRole(role)),
      ]);
    });

    for (const groups of [0, 1, 12]) {
      for (const roles of [0, 1, 12]) {
        test(`USR-DET-02 ${groups} groups and ${roles} roles`, async ({
          page,
          api,
          cleanup,
        }) => {
          // Up to 24 seeding requests: slow on a busy backend.
          test.setTimeout(120_000);
          const username = cleanup.user(uniqueName("user"));
          await api.createUser({ username });
          await Promise.all([
            ...seededGroups
              .slice(0, groups)
              .map((group) => api.addGroupMember(group, username)),
            ...seededRoles
              .slice(0, roles)
              .map((role) => api.assignRole({ user: username }, { role })),
          ]);
          await openDetail(page, api, username);
          await expect(
            page.getByRole("tab", { name: `Groups (${groups})` }),
          ).toBeVisible();
          await expect(
            page.getByRole("tab", { name: `Roles (${roles})` }),
          ).toBeVisible();
        });
      }
    }
  });

  const countRows = [
    { action: "add one group", tab: "Groups", change: 1 },
    { action: "add two groups", tab: "Groups", change: 2 },
    { action: "remove one group", tab: "Groups", change: -1 },
    { action: "add one role", tab: "Roles", change: 1 },
    { action: "add two roles", tab: "Roles", change: 2 },
    { action: "remove one role", tab: "Roles", change: -1 },
  ] as const;
  for (const row of countRows) {
    test(`USR-DET-03 ${row.action} updates ${row.tab} (n) by ${row.change}`, async ({
      page,
      api,
      cleanup,
    }) => {
      const username = cleanup.user(uniqueName("user"));
      await api.createUser({ username });
      const isGroup = row.tab === "Groups";
      const names = [0, 1].map(() =>
        isGroup
          ? cleanup.group(uniqueName("group"))
          : cleanup.role(uniqueName("role")),
      );
      for (const name of names) {
        if (isGroup) await api.createGroup(name);
        else await api.createRole({ name });
      }
      const removing = row.change < 0;
      const start = removing ? 2 : 0;
      if (removing) {
        for (const name of names) {
          if (isGroup) await api.addGroupMember(name, username);
          else await api.assignRole({ user: username }, { role: name });
        }
      }

      const detail = await openDetail(page, api, username);
      const tab = isGroup ? detail.groupsTab : detail.rolesTab;
      await tab.click();
      await expect(tab).toHaveText(`${row.tab} (${start})`);

      if (removing) {
        if (isGroup) await detail.removeGroup(names[0]);
        else await detail.removeRole(names[0]);
      } else {
        await page
          .getByRole("button", {
            name: isGroup ? "Add Group" : "Add Role",
            exact: true,
          })
          .click();
        const modal = new BatchAddModal(
          page,
          isGroup
            ? { title: "Add User to Group", grid: "Select groups" }
            : { title: "Add Role to User", grid: "Select roles" },
        );
        for (const name of names.slice(0, row.change)) {
          await modal.select(isGroup ? "Name" : "Role", name);
        }
        await modal.addButton().click();
        await expect(modal.dialog).toBeHidden();
      }
      await expect(tab).toHaveText(`${row.tab} (${start + row.change})`);
    });
  }

  test("USR-DET-04 edit from the actions menu shows the new values without a reload", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username, ...filledUser });
    const detail = await openDetail(page, api, username);
    const modal = await detail.openEdit(username);
    await modal.field("First name").fill("Fresh");
    await modal.field("Email").fill("fresh@example.com");
    await modal.button("Save").click();
    await modal.expectClosed();
    const again = await detail.openEdit(username);
    await expect(again.field("First name")).toHaveValue("Fresh");
    await expect(again.field("Email")).toHaveValue("fresh@example.com");
  });

  test("USR-DET-05 switching tabs keeps each tab's own table and filter", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    const detail = await openDetail(page, api, username);
    await expect(detail.groupsTable).toBeVisible();
    await detail.groups.filterInput("Name").fill("only-in-groups");

    await detail.rolesTab.click();
    await expect(detail.rolesTable).toBeVisible();
    await expect(detail.groupsTable).toBeHidden();
    await expect(detail.roles.filterInput("Role")).toHaveValue("");

    await detail.groupsTab.click();
    await expect(detail.groupsTable).toBeVisible();
    await expect(detail.rolesTable).toBeHidden();
  });

  // --- Groups tab ---------------------------------------------------------

  test("USR-GRP-01 only the user's own groups are listed", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    const [inA, inB, outside] = [0, 1, 2].map(() =>
      cleanup.group(uniqueName("group")),
    );
    for (const group of [inA, inB, outside]) await api.createGroup(group);
    await api.addGroupMember(inA, username);
    await api.addGroupMember(inB, username);

    const detail = await openDetail(page, api, username);
    await expect(detail.groups.rows).toHaveCount(2);
    await expect(detail.groups.row(inA)).toBeVisible();
    await expect(detail.groups.row(inB)).toBeVisible();
    await expect(detail.groups.row(outside)).toHaveCount(0);
  });

  test("USR-GRP-02 a user with no groups shows the empty state", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    await api.createGroup(cleanup.group(uniqueName("group")));
    const detail = await openDetail(page, api, username);
    await expect(
      detail.groups.stateHeading("User is not a member of any group"),
    ).toBeVisible();
    await expect(detail.groups.rows).toHaveCount(1);
  });

  test("USR-GRP-03 add and remove a group", async ({
    page,
    api,
    cleanup,
    toasts,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const group = cleanup.group(uniqueName("group"));
    await api.createUser({ username });
    await api.createGroup(group);
    const detail = await openDetail(page, api, username);
    await detail.addGroup(group);
    await expect(
      toasts.success(`1 group added to user "${username}"`),
    ).toBeVisible();
    await detail.removeGroup(group);
    await expect(
      toasts.success(`User "${username}" removed from group "${group}"`),
    ).toBeVisible();
    await expect.poll(() => api.userGroupNames(username)).toEqual([]);
  });

  test("USR-GRP-04 Remove is enabled on every group", async ({
    page,
    api,
    cleanup,
    secondUser,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    // One group the admin owns and one it holds no role on.
    const owned = cleanup.group(uniqueName("group"));
    await api.createGroup(owned);
    await api.addGroupMember(owned, username);
    const creator = await secondUser.create();
    const role = cleanup.role(uniqueName("role"));
    await api.createRole({ name: role, permissions: ["core.add_group"] });
    await api.assignRole({ user: creator.username }, { role });
    const foreign = cleanup.group(uniqueName("group"));
    const creatorPage = await secondUser.login(creator);
    const response = await creatorPage.request.post(
      `/api/pulp/${api.domainEnabled ? "default/" : ""}api/v3/groups/`,
      {
        data: { name: foreign },
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${creator.username}:${creator.password}`).toString(
              "base64",
            ),
        },
      },
    );
    expect(response.ok()).toBe(true);
    await api.addGroupMember(foreign, username);

    const detail = await openDetail(page, api, username);
    for (const group of [owned, foreign]) {
      await detail.groups
        .row(group)
        .getByRole("button", { name: "Kebab toggle" })
        .click();
      await expect(
        page.getByRole("menuitem", { name: "Remove", exact: true }),
      ).not.toHaveAttribute("aria-disabled", "true");
      await page.keyboard.press("Escape");
    }
  });

  test("USR-GRP-05 user › Groups › add group G shows on G and in the Users list", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const group = cleanup.group(uniqueName("group"));
    await api.createUser({ username });
    await api.createGroup(group);
    const detail = await openDetail(page, api, username);
    await detail.addGroup(group);

    await detail.groupsTable
      .getByRole("link", { name: group, exact: true })
      .click();
    await expect(
      page
        .getByRole("grid", { name: "Group users table" })
        .getByRole("link", { name: username, exact: true }),
    ).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Nav" });
    await nav.getByRole("button", { name: "Administration" }).click();
    await nav.getByRole("link", { name: "Users", exact: true }).click();
    const usersGrid = page.getByRole("grid", { name: "Users table" });
    await expect(usersGrid).toBeVisible();
    await page.getByPlaceholder("Filter by Username").fill(username);
    await expect(
      cell(
        usersGrid.getByRole("row").filter({ hasText: username }),
        COL.groups,
      ),
    ).toHaveText("1");
  });

  test("USR-GRP-05 user › Groups › remove group G no longer shows on G", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    const group = cleanup.group(uniqueName("group"));
    await api.createUser({ username });
    await api.createGroup(group);
    await api.addGroupMember(group, username);
    const detail = await openDetail(page, api, username);
    await detail.removeGroup(group);
    await page.goto(`/admin/groups/${await groupId(api, group)}`);
    await expect(page.getByRole("tab", { name: "Users (0)" })).toBeVisible();
  });

  for (const action of ["add", "remove"] as const) {
    test(`USR-GRP-05 G › Users › ${action} the user shows on the open user page`, async ({
      page,
      api,
      cleanup,
      groupsPage,
    }) => {
      const username = cleanup.user(uniqueName("user"));
      const group = cleanup.group(uniqueName("group"));
      await api.createUser({ username });
      await api.createGroup(group);
      if (action === "remove") await api.addGroupMember(group, username);

      // Visit the user page first so its record is cached, then move in-app.
      const userDetail = await openDetail(page, api, username);
      await expect(userDetail.groupsTab).toHaveText(
        `Groups (${action === "add" ? 0 : 1})`,
      );
      const nav = page.getByRole("navigation", { name: "Nav" });
      await nav.getByRole("button", { name: "Administration" }).click();
      await nav.getByRole("link", { name: "Groups", exact: true }).click();
      await expect(groupsPage.heading).toBeVisible();
      await groupsPage.filterBy("Name", group);
      const groupDetail = await groupsPage.openDetail(group);
      if (action === "add") {
        await groupDetail.addUser(username);
        await groupDetail.usersTable
          .getByRole("link", { name: username, exact: true })
          .click();
        await expect(userDetail.groupsTab).toHaveText("Groups (1)");
        await expect(userDetail.groups.row(group)).toBeVisible();
      } else {
        await groupDetail.removeUser(username);
        await nav.getByRole("button", { name: "Administration" }).click();
        await nav.getByRole("link", { name: "Users", exact: true }).click();
        await page.getByPlaceholder("Filter by Username").fill(username);
        await page
          .getByRole("grid", { name: "Users table" })
          .getByRole("link", { name: username, exact: true })
          .click();
        await expect(userDetail.title).toBeVisible();
        await expect(userDetail.groupsTab).toHaveText("Groups (0)");
        await expect(userDetail.groups.row(group)).toHaveCount(0);
      }
    });
  }

  test("USR-GRP-06 Add Group is always enabled", async ({
    page,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    await openDetail(page, api, username);
    await expect(
      page.getByRole("button", { name: "Add Group", exact: true }),
    ).toBeEnabled();
  });
});
