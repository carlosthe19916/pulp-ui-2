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
  /**
   * USR-LIST-01 · Row content
   *
   * Summary: The Users list shows each user's username (linking to their detail page), email, active state, group count and join date.
   *
   * When I open Users from the Administration navigation
   * Then the heading is "Users", the Users nav item is highlighted, the browser tab title contains
   * "Users", and the column headers are, in order: Username, Email, Active, Groups, Date Joined, actions
   * And each row shows the username as a link to that user's detail page, the Email (or "—"), an
   * Active or Inactive label, the Groups count, and a formatted Date Joined
   *
   * Main cases (email present / absent, active / inactive, 0 / 1 groups):
   *
   * | email             | active | groups | email cell        | label    |
   * | ----------------- | ------ | ------ | ----------------- | -------- |
   * | alice@example.com | yes    | 0      | alice@example.com | Active   |
   * | (none)            | no     | 1      | —                 | Inactive |
   */
  test(
    "The Users list shows each user's username (linking to their detail page), email, active state, group count and join date.",
    {
      tag: "@USR-LIST-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-LIST-01",
      },
    },
    async ({ usersPage, api, cleanup, page }) => {
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
    },
  );

  /**
   * USR-LIST-05 · Filtering, sorting and paging
   *
   * Summary: The Users list filters by username, sorts, pages and shows the filtered empty state, all server-side.
   *
   * Seed: more than two pages of users
   *
   * When I open the Users list
   * Then the rows are sorted by Username ascending
   * When I type a username substring in the Username filter
   * Then only matching users are listed, on page 1, and the item total matches
   * When I filter by a value that matches nothing
   * Then "No results found" shows with the text "No results match the current filter. Try adjusting
   * or clearing your filters." and a "Clear all filters" button that restores the rows
   * When I sort by Username descending, then by Date Joined
   * Then the rows reorder accordingly and stay on page 1
   * When I page through the results and change the page size to 20
   * Then the right rows and item range are shown
   */
  test(
    "The Users list filters by username, sorts, pages and shows the filtered empty state, all server-side.",
    {
      tag: "@USR-LIST-05",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-LIST-05",
      },
    },
    async ({ usersPage, api, cleanup }) => {
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
      await expect(
        usersPage.list.stateHeading("No results found"),
      ).toBeVisible();
      await usersPage.list.clearAllFiltersInEmptyState().click();
      await usersPage.list.expectLoaded();

      await usersPage.list.filter("Username", token);
      await usersPage.list.sortBy("Username");
      await usersPage.list.expectSorted("Username", "descending");
      const shown = await usersPage.list.columnTexts("Username");
      expect(shown).toEqual([...shown].sort().reverse());

      await usersPage.list.paginator().setPerPage(20);
      await usersPage.list.paginator().expectRange(/^1 - 12 of 12\s*$/);
    },
  );

  /**
   * USR-LIST-06 · A non-superuser cannot read the Users list
   *
   * Summary: A non-superuser opening the Users list sees “403: Access denied” and no rows, with or without Staff status.
   *
   * Auth: second-user
   *
   * Given a second user who is not a superuser (with or without Staff status)
   * When they open the Users list
   * Then the table shows "403: Access denied" and no rows (Pulp lets only superusers list users)
   */
  test(
    "A non-superuser opening the Users list sees “403: Access denied” and no rows, with or without Staff status.",
    {
      tag: "@USR-LIST-06",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-LIST-06",
      },
    },
    async ({ secondUser }) => {
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
    },
  );

  // --- Create -------------------------------------------------------------

  /**
   * USR-CRE-07 · Create a user
   *
   * Summary: Creating a user with every field and both flags set shows a success toast and the new user in the list.
   *
   * When I click "Create user", fill a valid username and password, fill Email, First name and Last
   * name, set Active and Staff status, and submit
   * Then the modal closes, the toast `User "<username>" created` appears, and the user is in the
   * Users list with Groups 0 and the matching Active label, saved with exactly the fields and flags
   * I set
   */
  test(
    "Creating a user with every field and both flags set shows a success toast and the new user in the list.",
    {
      tag: ["@smoke", "@USR-CRE-07"],
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-CRE-07",
      },
    },
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

  /**
   * USR-CRE-08 · Active controls whether a user can log in
   *
   * Summary: A user created active can log in and one created inactive cannot; deactivating then reactivating toggles their access.
   *
   * Auth: second-user
   *
   * Given I create a user
   * When they try to log in with the password I set
   * Then an active user is logged in and an inactive user is rejected
   * When I edit an active user to Active unchecked
   * Then their next login is rejected
   * When I edit them back to Active checked
   * Then they can log in again
   */
  test(
    "A user created active can log in and one created inactive cannot; deactivating then reactivating toggles their access.",
    {
      tag: "@USR-CRE-08",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-CRE-08",
      },
    },
    async ({ page, usersPage, cleanup, secondUser }) => {
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
    },
  );

  /**
   * USR-CRE-09 · A duplicate username is rejected in the form
   *
   * Summary: Submitting Create user with an existing username surfaces the server's “must be unique” error in the form.
   *
   * When I open "Create user" and submit a username that already exists
   * Then an in-form error shows the server's reason "This field must be unique.", no toast appears,
   * and the modal stays open with my values kept
   */
  test(
    "Submitting Create user with an existing username surfaces the server's “must be unique” error in the form.",
    {
      tag: "@USR-CRE-09",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-CRE-09",
      },
    },
    async ({ page, usersPage, api, cleanup }) => {
      const username = cleanup.user(uniqueName("user"));
      await api.createUser({ username });
      const modal = await openCreate(page, usersPage);
      await modal.field("Username").fill(username);
      await modal.field("Password").fill(STRONG_PASSWORD);
      await modal.button("Create").click();
      await modal.expectSubmitError("This field must be unique.");
      await expect(modal.dialog).toBeVisible();
    },
  );

  /**
   * USR-CRE-10 · Create is not gated for a non-superuser
   *
   * Summary: A non-superuser can open Create user, but submitting a valid form fails with a permission-denied error in the form.
   *
   * Auth: second-user
   *
   * Given a second user without permission to add users
   * Then "Create user" is enabled, and submitting a valid form shows the in-form error title
   * "Failed to create user" with the text "You do not have permission to perform this action. Ask an
   * administrator to grant the required role."
   */
  test(
    "A non-superuser can open Create user, but submitting a valid form fails with a permission-denied error in the form.",
    {
      tag: "@USR-CRE-10",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-CRE-10",
      },
    },
    async ({ secondUser }) => {
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
    },
  );

  // --- Edit ---------------------------------------------------------------

  /**
   * USR-EDT-03 · Changing several fields at once
   *
   * Summary: Editing several of a user's fields at once saves them all, and the changes show on the list and the detail page.
   *
   * Given a user with every field filled
   * When I open Edit from the Users list, change a mix of fields including a flag (for example Email,
   * First name and Active), and save
   * Then the modal closes, the toast `User "<username>" updated` appears, every changed field is
   * saved and the others are unchanged, the list shows the new Email and label, and reopening Edit
   * on the detail page shows the new values
   */
  test(
    "Editing several of a user's fields at once saves them all, and the changes show on the list and the detail page.",
    {
      tag: "@USR-EDT-03",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-EDT-03",
      },
    },
    async ({ page, usersPage, api, cleanup, toasts }) => {
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
    },
  );

  // One representative of the "form omits an empty field" UI gap across admin forms.
  /**
   * USR-EDT-05 · Clearing a text field
   *
   * Summary: Clearing a user's email and saving keeps the old value — the one representative of the “form omits empty fields” UI gap.
   *
   * Given a user with Email filled
   * When I clear Email and save
   * Then the saved user has Email empty and the list shows "—"
   *
   * UI gap: Pulp accepts an empty value, but the form leaves empty fields out of the update, so
   * today the old value is kept. This is the one representative of this gap across the admin forms.
   */
  test(
    "Clearing a user's email and saving keeps the old value — the one representative of the “form omits empty fields” UI gap.",
    {
      tag: "@USR-EDT-05",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-EDT-05",
      },
    },
    async ({ usersPage, api, cleanup }) => {
      const username = cleanup.user(uniqueName("user"));
      await api.createUser({ username, ...filledUser });
      await usersPage.goto();
      const modal = await usersPage.openEdit(username);
      await modal.field("Email").fill("");
      await modal.button("Save").click();
      await modal.expectClosed();
      await expect.poll(async () => (await api.user(username))?.email).toBe("");
      await expect(cell(usersPage.list.row(username), COL.email)).toHaveText(
        "—",
      );
    },
  );

  // --- Delete -------------------------------------------------------------

  const deleteRows = ["no groups, no roles", "in two groups"] as const;
  /**
   * USR-DEL-01 · Delete from the list
   *
   * Summary: Deleting a user from the list confirms, spins then toasts, removes the row, and drops its group memberships.
   *
   * Given a user with <memberships>
   * When I open "Delete" from the Users list
   * Then the dialog "Delete User" shows the body `Are you sure you want to delete "<username>"? This
   * action cannot be undone.` with a danger "Delete" button
   * When I confirm on a slow network
   * Then the button shows a spinner until the request finishes, then the dialog closes, the toast
   * `User "<username>" deleted` appears, the row is gone, and <aftermath>
   *
   * | memberships         | aftermath                                                       |
   * | ------------------- | --------------------------------------------------------------- |
   * | no groups, no roles | —                                                               |
   * | in two groups       | each group's Users tab no longer lists them, counts drop by one |
   */
  test(
    "Deleting a user from the list confirms, spins then toasts, removes the row, and drops its group memberships.",
    {
      tag: "@USR-DEL-01",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-DEL-01",
      },
    },
    async ({ page, usersPage, api, cleanup, toasts }) => {
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
    },
  );

  /**
   * USR-DEL-02 · Deleting the logged-in user
   *
   * Summary: Deleting your own superuser account (manual: the API can't create a second superuser).
   *
   * Manual
   *
   * Pulp's API can't create a superuser (it ignores `is_superuser`), so this needs one made with
   * `pulpcore-manager`.
   *
   * Given a second superuser logged in (never the e2e admin)
   * When they delete their own user
   * Then Pulp allows it: the toast `User "<username>" deleted` appears and their next request is
   * rejected as not logged in
   * And Open: decide what the UI shows after that (for example the login page)
   */
  test(
    "Deleting your own superuser account (manual: the API can't create a second superuser).",
    {
      tag: "@USR-DEL-02",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-DEL-02",
      },
    },
    () => {
      test.skip(
        true,
        "Manual: Pulp's API can't create a second superuser (is_superuser is ignored)",
      );
    },
  );

  /**
   * USR-DEL-04 · Delete fails when the user is already gone
   *
   * Summary: Confirming a delete for a user already removed elsewhere shows a danger toast and keeps the dialog open.
   *
   * Given I open "Delete" for a user who is deleted through the API before I confirm
   * When I confirm
   * Then a danger toast shows the server's "not found" reason, the dialog stays open, and the row is
   * unchanged
   */
  test(
    "Confirming a delete for a user already removed elsewhere shows a danger toast and keeps the dialog open.",
    {
      tag: "@USR-DEL-04",
      annotation: {
        type: "spec",
        description: "e2e/specs/users.md#USR-DEL-04",
      },
    },
    async ({ page, usersPage, api, cleanup, toasts }) => {
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
    },
  );
});
