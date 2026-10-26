import type { Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";
import { delayApi } from "@support/helpers/delayApi";
import { openViaNav } from "@support/helpers/nav";
import { STRONG_PASSWORD, uniqueName } from "@support/helpers/unique";
import { COL, cell, filledUser } from "@support/helpers/users";
import { ConfirmModal } from "@support/pom/ConfirmModal";
import { FormModal } from "@support/pom/FormModal";
import { UserDetailPage } from "@support/pom/UserDetailPage";
import type { UsersPage } from "@support/pom/UsersPage";

// Scenarios: e2e/specs/users.md (list, create, edit, delete).

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

test.describe("Users", () => {
  // --- List ---------------------------------------------------------------

  const listRows = [
    { email: "alice@example.com", active: true, groups: 0 },
    { email: "", active: false, groups: 1 },
  ];
  test("USR-LIST-01 row content", async ({ usersPage, api, cleanup, page }) => {
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

    // Reached from the Administration nav, which highlights the Users item.
    await openViaNav(page, "Users");
    await expect(page).toHaveTitle(/^Users · /);
    expect(await usersPage.list.headerTexts()).toEqual([
      "Username",
      "Email",
      "Active",
      "Groups",
      "Date Joined",
      "Actions",
    ]);
    for (const { row, username } of seeded) {
      await test.step(`email ${row.email || "(none)"}, ${row.active ? "active" : "inactive"}, ${row.groups} groups`, async () => {
        await usersPage.list.filter("Username", username);
        const tr = usersPage.list.row(username);
        await expect(
          tr.getByRole("link", { name: username, exact: true }),
        ).toBeVisible();
        await expect(cell(tr, COL.email)).toHaveText(row.email || "—");
        await expect(cell(tr, COL.active)).toHaveText(
          row.active ? "Active" : "Inactive",
        );
        await expect(cell(tr, COL.groups)).toHaveText(String(row.groups));
        await expect(cell(tr, COL.dateJoined)).not.toHaveText(/^—$|T\d\d:/);
      });
    }
  });

  test("USR-LIST-05 filtering, sorting and paging", async ({
    usersPage,
    api,
    cleanup,
  }) => {
    test.slow();
    // 12 users sharing a token: more than one 10-row page, filterable to this set.
    const token = uniqueName("ls").slice(-8);
    const names = Array.from({ length: 12 }, (_, i) =>
      cleanup.user(`e2e-${token}-u${String(i).padStart(2, "0")}`),
    );
    for (let i = 0; i < names.length; i += 6) {
      await Promise.all(
        names.slice(i, i + 6).map((username) => api.createUser({ username })),
      );
    }

    await usersPage.goto();
    await usersPage.list.expectSorted("Username", "ascending");

    await usersPage.list.filter("Username", token);
    await usersPage.list.expectLoaded();
    await expect
      .poll(async () => (await usersPage.list.paginator().range()).total)
      .toBe(12);

    await usersPage.list.filter("Username", `nomatch-${token}`);
    await expect(usersPage.list.stateHeading("No results found")).toBeVisible();
    await usersPage.list.clearAllFiltersInEmptyState().click();
    await usersPage.list.expectLoaded();

    await usersPage.list.filter("Username", token);
    await usersPage.list.sortBy("Username");
    await usersPage.list.expectSorted("Username", "descending");
    const shown = await usersPage.list.columnTexts("Username");
    expect(shown).toEqual([...shown].sort().reverse());

    await usersPage.list.paginator().setPerPage(20);
    await usersPage.list.paginator().expectRange(/^1 - 12 of 12\s*$/);
  });

  test("USR-LIST-06 a non-superuser cannot read the Users list", async ({
    secondUser,
  }) => {
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

  // --- Create -------------------------------------------------------------

  test(
    "USR-CRE-07 create a user",
    { tag: "@smoke" },
    async ({ page, usersPage, api, cleanup, toasts }) => {
      const username = cleanup.user(uniqueName("user"));
      const modal = await openCreate(page, usersPage);
      await modal.field("Username").fill(username);
      await modal.field("Password").fill(STRONG_PASSWORD);
      await modal.field("Email").fill("ada@example.com");
      await modal.field("First name").fill("Ada");
      await modal.field("Last name").fill("Lovelace");
      await modal.checkbox("Active").setChecked(true);
      await modal.checkbox("Staff status").setChecked(true);
      await modal.button("Create").click();
      await expect(toasts.success(`User "${username}" created`)).toBeVisible();
      await usersPage.list.filter("Username", username);
      const tr = usersPage.list.row(username);
      await expect(cell(tr, COL.groups)).toHaveText("0");
      await expect(cell(tr, COL.active)).toHaveText("Active");
      await expect
        .poll(() => api.user(username))
        .toMatchObject({
          email: "ada@example.com",
          first_name: "Ada",
          last_name: "Lovelace",
          is_active: true,
          is_staff: true,
        });
    },
  );

  test("USR-CRE-08 active controls whether a user can log in", async ({
    page,
    usersPage,
    cleanup,
    secondUser,
  }) => {
    test.slow();
    for (const active of [true, false]) {
      await test.step(`created ${active ? "active can" : "inactive cannot"} log in`, async () => {
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

    await test.step("deactivating an active user stops login, reactivating restores it", async () => {
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
  });

  test("USR-CRE-09 a duplicate username is rejected in the form", async ({
    page,
    usersPage,
    api,
    cleanup,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    const modal = await openCreate(page, usersPage);
    await modal.field("Username").fill(username);
    await modal.field("Password").fill(STRONG_PASSWORD);
    await modal.button("Create").click();
    await modal.expectSubmitError("This field must be unique.");
    await expect(modal.dialog).toBeVisible();
  });

  test("USR-CRE-10 create is not gated for a non-superuser", async ({
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
      "You do not have permission to perform this action. Ask an administrator to grant the required role.",
    );
  });

  // --- Edit ---------------------------------------------------------------

  test("USR-EDT-03 changing several fields at once", async ({
    page,
    usersPage,
    api,
    cleanup,
    toasts,
  }) => {
    test.slow();
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username, ...filledUser });
    await usersPage.goto();
    const modal = await usersPage.openEdit(username);
    await modal.field("Email").fill("after@example.com");
    await modal.field("First name").fill("After");
    await modal.checkbox("Active").setChecked(false);
    await modal.button("Save").click();
    await modal.expectClosed();
    await expect(toasts.success(`User "${username}" updated`)).toBeVisible();
    await expect
      .poll(() => api.user(username))
      .toMatchObject({
        ...filledUser,
        email: "after@example.com",
        first_name: "After",
        is_active: false,
      });

    // Cross-page sync: the Users list and the detail edit form show the new values.
    await usersPage.goto();
    await usersPage.list.filter("Username", username);
    await expect(cell(usersPage.list.row(username), COL.email)).toHaveText(
      "after@example.com",
    );
    await usersPage.openDetail(username);
    const again = await new UserDetailPage(page, username).openEdit(username);
    await expect(again.field("First name")).toHaveValue("After");
  });

  // One representative of the "form omits an empty field" UI gap across admin forms.
  test("USR-EDT-05 clearing a field", async ({ usersPage, api, cleanup }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username, ...filledUser });
    await usersPage.goto();
    const modal = await usersPage.openEdit(username);
    await modal.field("Email").fill("");
    await modal.button("Save").click();
    await modal.expectClosed();
    await expect.poll(async () => (await api.user(username))?.email).toBe("");
    await expect(cell(usersPage.list.row(username), COL.email)).toHaveText("—");
  });

  // --- Delete -------------------------------------------------------------

  const deleteRows = ["no groups, no roles", "in two groups"] as const;
  test("USR-DEL-01 delete from the list", async ({
    page,
    usersPage,
    api,
    cleanup,
    toasts,
  }) => {
    test.slow();
    for (const memberships of deleteRows) {
      await test.step(memberships, async () => {
        const username = cleanup.user(uniqueName("user"));
        await api.createUser({ username });
        const groups: string[] = [];
        if (memberships === "in two groups") {
          // Each group keeps another member, so its count drops from 2 to 1.
          const other = cleanup.user(uniqueName("user"));
          await api.createUser({ username: other });
          for (let i = 0; i < 2; i++) {
            const group = cleanup.group(uniqueName("group"));
            const { id } = await api.createGroup(group);
            await api.addGroupMember(group, username);
            await api.addGroupMember(group, other);
            groups.push(String(id));
          }
        }

        await usersPage.goto();
        await usersPage.list.filter("Username", username);
        await usersPage.rowAction(username, "Delete");
        const dialog = new ConfirmModal(page, "Delete User");
        await expect(dialog.dialog).toContainText(
          `Are you sure you want to delete "${username}"? This action cannot be undone.`,
        );
        // Slow network: the dialog stays open until the request finishes.
        const held = await delayApi(page, {
          url: (url) => url.pathname.includes("/users/"),
          method: "DELETE",
        });
        await dialog.button("Delete").click();
        await expect(dialog.dialog).toBeVisible();
        held.release();
        await expect(dialog.dialog).toBeHidden();
        await expect(
          toasts.success(`User "${username}" deleted`),
        ).toBeVisible();
        await usersPage.expectRowGone(username);
        await expect.poll(() => api.user(username)).toBeUndefined();

        for (const id of groups) {
          await page.goto(`/admin/groups/${id}`);
          await expect(
            page.getByRole("tab", { name: "Users (1)" }),
          ).toBeVisible();
          await expect(
            page
              .getByRole("grid", { name: "Group users table" })
              .getByRole("link", { name: username, exact: true }),
          ).toHaveCount(0);
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

  test("USR-DEL-04 delete fails when the user is already gone", async ({
    page,
    usersPage,
    api,
    cleanup,
    toasts,
  }) => {
    const username = cleanup.user(uniqueName("user"));
    await api.createUser({ username });
    await usersPage.goto();
    await usersPage.list.filter("Username", username);
    await usersPage.rowAction(username, "Delete");
    const dialog = new ConfirmModal(page, "Delete User");
    await api.deleteUser(username);
    await dialog.button("Delete").click();
    await expect(
      toasts.danger(`Failed to delete user "${username}"`),
    ).toBeVisible();
    await expect(dialog.dialog).toBeVisible();
  });
});
