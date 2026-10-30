import type { Page } from "@playwright/test";

import { expect, test } from "@support/fixtures";
import { openViaNav } from "@support/helpers/nav";
import type { PulpApi } from "@support/helpers/pulp-api";
import type { AccessPoliciesPage } from "@support/pom/AccessPoliciesPage";
import { DataTable } from "@support/pom/DataTable";

// Scenarios: e2e/specs/access-policies.md (ACP-*).

// Every test here edits or resets a policy, which changes server-wide behaviour:
// run them in order in one worker ("default" opts out of fullyParallel without
// skipping the rest after a failure, as "serial" would), and
// `cleanup.accessPolicy` resets each policy in teardown.
test.describe.configure({ mode: "default" });

// Viewsets no other admin test relies on, so a broken policy can't leak into them.
const V_BREAK = "content/ostree/summaries"; // also its collection path
const V_HOOKS = "remotes/ansible/role"; // has creation hooks and queryset scoping
const V_EDIT = "remotes/ansible/git";
const V_RESET = "acs/deb/deb";

const ALLOW = {
  action: ["list"],
  principal: "authenticated",
  effect: "allow",
};
const statements = (k: number) =>
  [ALLOW, { ...ALLOW, action: ["retrieve"] }, { ...ALLOW, action: ["destroy"] }]
    .slice(0, k)
    .map((statement) => ({ ...statement }));
const json = (value: unknown) => JSON.stringify(value, null, 2);

/** Count PATCHes to access policies from now on ("nothing is sent" checks). */
const recordPolicyWrites = (page: Page): { count: number } => {
  const writes = { count: 0 };
  page.on("request", (request) => {
    if (
      request.method() === "PATCH" &&
      request.url().includes("/access_policies/")
    ) {
      writes.count++;
    }
  });
  return writes;
};

const cell = (acp: AccessPoliciesPage, viewset: string, index: number) =>
  acp.exactRow(viewset).getByRole("gridcell").nth(index);

const expectStatus = async (
  acp: AccessPoliciesPage,
  viewset: string,
  { status, statements: n }: { status: string; statements?: number },
) => {
  await expect(cell(acp, viewset, 2)).toHaveText(status);
  if (n !== undefined)
    await expect(cell(acp, viewset, 1)).toHaveText(String(n));
};

const openRowMenu = async (acp: AccessPoliciesPage, viewset: string) => {
  await acp
    .exactRow(viewset)
    .getByRole("button", { name: "Kebab toggle" })
    .click();
};

test.describe("Access policies", () => {
  test.beforeEach(async ({ accessPoliciesPage }) => {
    await accessPoliciesPage.goto();
  });

  test.describe("List", () => {
    /**
     * ACP-LIST-01 · Page and row content
     *
     * Summary: The Access policies page shows its heading and description, 10 rows per page with viewset, statements, status and Edit/Reset, and no create or delete.
     *
     * When I open Access policies from the Administration navigation
     * Then the heading is "Access policies", the nav item is highlighted, and the page text reads "Each
     * policy decides who may call one API endpoint. Changing them is advanced; reset a policy to restore
     * its plugin's default."
     * And the table shows 10 rows per page, with no create button and no delete action
     * And each row shows its viewset name (plain text), a Statements count, a Status label — Default, or
     * Customized once edited — and row actions "Edit" and "Reset to default"
     */
    test(
      "The Access policies page shows its heading and description, 10 rows per page with viewset, statements, status and Edit/Reset, and no create or delete.",
      {
        tag: "@ACP-LIST-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/access-policies.md#ACP-LIST-01",
        },
      },
      async ({ accessPoliciesPage: acp, page }) => {
        // Reached from the Administration nav, which highlights the item.
        await openViaNav(page, "Access policies");
        await expect(page).toHaveTitle(/^Access policies · /);
        await expect(
          page.getByText(
            "Each policy decides who may call one API endpoint. Changing them is advanced; reset a policy to restore its plugin's default.",
          ),
        ).toBeVisible();
        await acp.list.expectLoaded();
        await expect(acp.list.rows).toHaveCount(10);
        await expect(acp.list.paginator().toggle).toHaveText(
          /^1 - 10 of \d+\s*$/,
        );
        await expect(
          page.getByRole("main").getByRole("button", { name: /create/i }),
        ).toHaveCount(0);
        // Row content: viewset is plain text, Status shows a label, Statements a count.
        const firstRow = acp.list.rows.first();
        await expect(firstRow.getByRole("gridcell").nth(0)).not.toHaveText("");
        await expect(
          firstRow.getByRole("gridcell").nth(0).getByRole("link"),
        ).toHaveCount(0);
        await expect(firstRow.getByRole("gridcell").nth(2)).toHaveText(
          /Default|Customized/,
        );
        await firstRow.getByRole("button", { name: "Kebab toggle" }).click();
        await expect(page.getByRole("menuitem")).toHaveText([
          "Edit",
          "Reset to default",
        ]);
      },
    );
  });

  test.describe("Edit", () => {
    type Outcome =
      | { kind: "client"; error: string }
      | { kind: "server"; error: string }
      | { kind: "saved" }
      | { kind: "broken"; listStatus: number }
      | { kind: "kept"; field: "creation_hooks" | "queryset_scoping" }
      | { kind: "emptied" };
    interface IValidationRow {
      field: "Statements" | "Creation hooks" | "Queryset scoping";
      label: string;
      viewset: string;
      value: (saved: { statements: unknown }) => string;
      outcome: Outcome;
    }
    // Client JSON validation (empty, `[`) is a component test; the server's
    // 400-shape rejections are api contract tests. Only e2e can show the values
    // Pulp saves but that then break the endpoint — keep the main representatives.
    const validationRows: IValidationRow[] = [
      {
        field: "Statements",
        label: "[] (denies everyone)",
        viewset: V_BREAK,
        value: () => "[]",
        outcome: { kind: "broken", listStatus: 403 },
      },
      {
        field: "Statements",
        label: "a statement without principal or action",
        viewset: V_BREAK,
        value: () => json([{ effect: "allow" }]),
        outcome: { kind: "broken", listStatus: 500 },
      },
      {
        field: "Queryset scoping",
        label: '{"function": "not_a_function"}',
        viewset: V_BREAK,
        value: () => '{"function": "not_a_function"}',
        outcome: { kind: "broken", listStatus: 500 },
      },
    ];

    /**
     * ACP-EDT-02 · Values Pulp accepts but that break the endpoint
     *
     * Summary: Policy values Pulp saves without checking (empty statements, a missing principal, bad scoping) break the guarded endpoint afterwards.
     *
     * Serial
     *
     * Pulp saves these values without checking them; the damage only shows on the endpoint the policy
     * guards. Use a viewset nothing else in the run needs, and reset it right after.
     *
     * When I set <field> to <value> and click "Save"
     * Then <outcome>
     *
     * | field            | value                            | outcome                                                                                |
     * | ---------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
     * | Statements       | `[]`                             | saved; afterwards everyone, admin included, gets "403: Access denied" on that endpoint |
     * | Statements       | a statement without `principal`  | saved; afterwards requests to that endpoint fail with a server error                   |
     * | Queryset scoping | `{"function": "not_a_function"}` | saved; afterwards the endpoint's list fails with a server error                        |
     */
    test(
      "Policy values Pulp saves without checking (empty statements, a missing principal, bad scoping) break the guarded endpoint afterwards.",
      {
        tag: "@ACP-EDT-02",
        annotation: {
          type: "spec",
          description: "e2e/specs/access-policies.md#ACP-EDT-02",
        },
      },
      async ({ accessPoliciesPage: acp, api, cleanup, page, toasts }) => {
        test.slow();
        cleanup.accessPolicy(V_BREAK);
        cleanup.accessPolicy(V_HOOKS);
        for (const row of validationRows) {
          await test.step(`${row.field} = ${row.label}`, async () => {
            const saved = await api.accessPolicy(row.viewset);
            // Reload so each row edits from fresh state and no modal is left open.
            await acp.page.reload();
            await acp.find(row.viewset);
            const modal = await acp.openEdit(row.viewset);
            const writes = recordPolicyWrites(page);
            await modal.field(row.field).fill(row.value(saved));
            await modal.button("Save").click();

            const { outcome } = row;
            if (outcome.kind === "client") {
              await expect(modal.dialog.getByText(outcome.error)).toBeVisible();
              await expect(modal.dialog).toBeVisible();
              expect(writes.count).toBe(0);
              await modal.close("Cancel");
              return;
            }
            if (outcome.kind === "server") {
              await modal.expectSubmitError(outcome.error);
              await toasts.expectNone();
              await modal.close("Cancel");
              return;
            }
            await expect(
              toasts.success(`Policy "${row.viewset}" saved`),
            ).toBeVisible();
            await modal.expectClosed();
            const after = await api.accessPolicy(row.viewset);
            expect(after.customized).toBe(true);
            if (outcome.kind === "broken") {
              // Pulp accepts the value; the damage shows on the endpoint it guards.
              await expect
                .poll(() => api.listStatus(V_BREAK))
                .toBe(outcome.listStatus);
              await api.resetAccessPolicy(row.viewset);
            } else if (outcome.kind === "kept") {
              expect(after[outcome.field]).toEqual(saved[outcome.field]);
            } else if (outcome.kind === "emptied") {
              expect(after.creation_hooks).toEqual([]);
            }
          });
        }
      },
    );

    /**
     * ACP-EDT-03 · A successful save
     *
     * Summary: Saving valid statements marks the policy Customized and enables Reset; re-saving keeps it Customized.
     *
     * Serial
     *
     * Given a policy with Status Default
     * When I change its statements to a valid list and save
     * Then the toast `Policy "<viewset>" saved` appears, the modal closes, the row's Status is
     * Customized, the Statements count matches, and "Reset to default" becomes enabled
     * When I open Edit on that now-customized policy and save again (even unchanged)
     * Then Status stays Customized and the saved statements are shown (Pulp marks a policy Customized on
     * every save)
     */
    test(
      "Saving valid statements marks the policy Customized and enables Reset; re-saving keeps it Customized.",
      {
        tag: "@ACP-EDT-03",
        annotation: {
          type: "spec",
          description: "e2e/specs/access-policies.md#ACP-EDT-03",
        },
      },
      async ({ accessPoliciesPage: acp, api, cleanup, page, toasts }) => {
        test.slow();
        cleanup.accessPolicy(V_EDIT);
        for (const k of [3]) {
          await test.step(`${k} statements`, async () => {
            // Each row edits from the default, so reset first (steps are independent).
            await api.resetAccessPolicy(V_EDIT);
            await acp.page.reload();
            await acp.find(V_EDIT);
            await expectStatus(acp, V_EDIT, { status: "Default" });
            const modal = await acp.openEdit(V_EDIT);
            await modal.field("Statements").fill(json(statements(k)));
            await modal.button("Save").click();
            await expect(
              toasts.success(`Policy "${V_EDIT}" saved`),
            ).toBeVisible();
            await modal.expectClosed();
            await expectStatus(acp, V_EDIT, {
              status: "Customized",
              statements: k,
            });
            await openRowMenu(acp, V_EDIT);
            await expect(
              page.getByRole("menuitem", { name: "Reset to default" }),
            ).not.toHaveAttribute("aria-disabled", "true");
          });
        }

        // Editing an already-customized policy keeps it Customized (Pulp marks a
        // policy Customized on every save, even when nothing changed).
        await test.step("re-saving a customized policy keeps it customized", async () => {
          // Reload to a clean list (the previous step left a row menu open).
          await acp.page.reload();
          await acp.find(V_EDIT);
          const target = (await api.accessPolicy(V_EDIT)).statements;
          const modal = await acp.openEdit(V_EDIT);
          await modal.button("Save").click();
          await expect(
            toasts.success(`Policy "${V_EDIT}" saved`),
          ).toBeVisible();
          await expectStatus(acp, V_EDIT, {
            status: "Customized",
            statements: target.length,
          });
          const reopened = await acp.openEdit(V_EDIT);
          // Pulp stores JSON as jsonb, which reorders keys: compare parsed values.
          expect(
            JSON.parse(await reopened.field("Statements").inputValue()),
          ).toEqual(target);
          await reopened.close("Cancel");
        });
      },
    );
  });

  test.describe("Reset", () => {
    /**
     * ACP-RST-01 · Reset is only offered for customized policies
     *
     * Summary: “Reset to default” is disabled for a default policy and enabled for a customized one.
     *
     * When I open the row actions of a <status> policy
     * Then "Reset to default" is <state>
     *
     * | status     | state                                    |
     * | ---------- | ---------------------------------------- |
     * | default    | disabled, tooltip "Already the default." |
     * | customized | enabled                                  |
     *
     * Serial (for the customized row)
     */
    test(
      "reset is disabled for a default policy",
      {
        tag: "@ACP-RST-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/access-policies.md#ACP-RST-01",
        },
      },
      async ({ accessPoliciesPage: acp, page }) => {
        await acp.find(V_RESET);
        await openRowMenu(acp, V_RESET);
        const reset = page.getByRole("menuitem", { name: "Reset to default" });
        await expect(reset).toHaveAttribute("aria-disabled", "true");
        await reset.hover();
        await expect(page.getByRole("tooltip")).toHaveText(
          "Already the default.",
        );
        await reset.click({ force: true });
        await expect(page.getByRole("dialog")).toHaveCount(0);
      },
    );

    /**
     * ACP-RST-01 · Reset is only offered for customized policies
     *
     * Summary: “Reset to default” is disabled for a default policy and enabled for a customized one.
     *
     * When I open the row actions of a <status> policy
     * Then "Reset to default" is <state>
     *
     * | status     | state                                    |
     * | ---------- | ---------------------------------------- |
     * | default    | disabled, tooltip "Already the default." |
     * | customized | enabled                                  |
     *
     * Serial (for the customized row)
     */
    test(
      "reset is enabled for a customized policy",
      {
        tag: "@ACP-RST-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/access-policies.md#ACP-RST-01",
        },
      },
      async ({ accessPoliciesPage: acp, api, cleanup, page }) => {
        cleanup.accessPolicy(V_RESET);
        await api.updateAccessPolicy(V_RESET, { statements: statements(1) });
        await acp.page.reload();
        await acp.find(V_RESET);
        await openRowMenu(acp, V_RESET);
        await expect(
          page.getByRole("menuitem", { name: "Reset to default" }),
        ).not.toHaveAttribute("aria-disabled", "true");
      },
    );

    /**
     * ACP-RST-02 · Reset restores the default
     *
     * Summary: Resetting a customized policy restores its default statements, hooks and scoping and marks it Default again.
     *
     * Serial
     *
     * Given a customized policy whose statements, creation hooks and queryset scoping I changed
     * When I click "Reset to default"
     * Then the dialog "Reset access policy" shows `Restore "<viewset>" to its default? Your changes to
     * it are lost.` with a "Reset" button
     * When I confirm
     * Then the toast `Policy "<viewset>" reset to its default` appears, Status is Default, the
     * Statements count is back to the default, Edit shows the default values for all three fields, and
     * "Reset to default" is disabled again
     */
    test(
      "Resetting a customized policy restores its default statements, hooks and scoping and marks it Default again.",
      {
        tag: "@ACP-RST-02",
        annotation: {
          type: "spec",
          description: "e2e/specs/access-policies.md#ACP-RST-02",
        },
      },
      async ({ accessPoliciesPage: acp, api, cleanup, page, toasts }) => {
        cleanup.accessPolicy(V_RESET);
        const defaults = await api.accessPolicy(V_RESET);
        await api.updateAccessPolicy(V_RESET, {
          statements: statements(1),
          creation_hooks: [],
          queryset_scoping: { function: "scope_queryset" },
        });
        await acp.page.reload();
        await acp.find(V_RESET);
        await expectStatus(acp, V_RESET, {
          status: "Customized",
          statements: 1,
        });

        const dialog = await acp.openReset(V_RESET);
        await dialog.confirm("Reset");
        await expect(
          toasts.success(`Policy "${V_RESET}" reset to its default`),
        ).toBeVisible();
        await expectStatus(acp, V_RESET, {
          status: "Default",
          statements: defaults.statements.length,
        });
        const modal = await acp.openEdit(V_RESET);
        await expect(modal.field("Statements")).toHaveValue(
          json(defaults.statements),
        );
        await expect(modal.field("Creation hooks")).toHaveValue(
          defaults.creation_hooks ? json(defaults.creation_hooks) : "",
        );
        await expect(modal.field("Queryset scoping")).toHaveValue(
          defaults.queryset_scoping ? json(defaults.queryset_scoping) : "",
        );
        await modal.close("Cancel");
        await openRowMenu(acp, V_RESET);
        await expect(
          page.getByRole("menuitem", { name: "Reset to default" }),
        ).toHaveAttribute("aria-disabled", "true");
      },
    );

    /**
     * ACP-RST-03 · A failed reset
     *
     * Summary: A reset the server rejects shows a danger toast and keeps the dialog open (manual: needs an uninstalled plugin).
     *
     * Manual
     *
     * Given a customized policy whose plugin is no longer installed
     * When I confirm the reset
     * Then the danger toast "Failed to reset policy" appears and the dialog stays open
     *
     * Only superusers can reach this page, and Pulp resets any policy whose viewset still exists, so
     * this is the only way a reset fails.
     */
    test(
      "A reset the server rejects shows a danger toast and keeps the dialog open (manual: needs an uninstalled plugin).",
      {
        tag: "@ACP-RST-03",
        annotation: {
          type: "spec",
          description: "e2e/specs/access-policies.md#ACP-RST-03",
        },
      },
      () => {
        test.skip(
          true,
          "Manual: a reset only fails for a policy whose plugin is no longer installed",
        );
      },
    );
  });

  test.describe("Permissions", () => {
    /**
     * ACP-PERM-01 · Only superusers can see or change access policies
     *
     * Summary: A non-superuser opening Access policies sees “403: Access denied” with no editable rows.
     *
     * Auth: second-user
     *
     * Given a second user who is not a superuser
     * When they open Access policies
     * Then the table shows "403: Access denied" and there is no row to edit or reset
     */
    test(
      "A non-superuser opening Access policies sees “403: Access denied” with no editable rows.",
      {
        tag: "@ACP-PERM-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/access-policies.md#ACP-PERM-01",
        },
      },
      async ({ secondUser }) => {
        const user = await secondUser.create();
        const page = await secondUser.login(user);
        await page.goto("/admin/access-policies");
        const table = new DataTable(
          page.getByRole("main"),
          "Access policies table",
        );
        await expect(table.stateHeading("403: Access denied")).toBeVisible();
        await expect(
          table.grid.getByRole("button", { name: "Kebab toggle" }),
        ).toHaveCount(0);
      },
    );
  });

  test.describe("Effect", () => {
    // One representative; other endpoints use the same mechanism.
    const effectCases = [
      {
        page: "Tasks",
        viewset: "tasks",
        path: "/monitoring/default/tasks",
        grid: "Tasks table",
      },
    ];
    /**
     * ACP-EFF-01 · A policy change takes effect
     *
     * Summary: Tightening the tasks policy to admins-only blocks a non-superuser from the Tasks list until it is reset.
     *
     * Auth: second-user
     * Serial
     *
     * Given a second user who can see the Tasks list today
     * When I change the `tasks` policy so that only admins may list it
     * Then the second user sees "403: Access denied" on Tasks
     * When I reset the policy
     * Then the second user sees the list again
     */
    test(
      "Tightening the tasks policy to admins-only blocks a non-superuser from the Tasks list until it is reset.",
      {
        tag: "@ACP-EFF-01",
        annotation: {
          type: "spec",
          description: "e2e/specs/access-policies.md#ACP-EFF-01",
        },
      },
      async ({ accessPoliciesPage: acp, api, cleanup, secondUser }) => {
        test.slow();
        for (const row of effectCases) {
          await test.step(row.page, async () => {
            // Briefly tightens a viewset other tests' second users may list; reset
            // right after (and again in teardown).
            cleanup.accessPolicy(row.viewset);
            const user = await secondUser.create();
            const userPage = await secondUser.login(user);
            const table = new DataTable(userPage.getByRole("main"), row.grid);
            await userPage.goto(row.path);
            await table.expectLoaded();
            await expect(table.stateHeading("403: Access denied")).toHaveCount(
              0,
            );

            const tightened = await adminOnlyList(api, row.viewset);
            // Reload the admin list so the filter from the previous step is cleared.
            await acp.goto();
            await acp.find(row.viewset);
            const modal = await acp.openEdit(row.viewset);
            await modal.field("Statements").fill(json(tightened));
            await modal.button("Save").click();
            await modal.expectClosed();

            await userPage.reload();
            await expect(
              table.stateHeading("403: Access denied"),
            ).toBeVisible();

            const dialog = await acp.openReset(row.viewset);
            await dialog.confirm("Reset");
            await userPage.reload();
            await table.expectLoaded();
            await expect(table.stateHeading("403: Access denied")).toHaveCount(
              0,
            );
          });
        }
      },
    );
  });
});

/** The viewset's statements with every "list" statement limited to admins. */
async function adminOnlyList(
  api: PulpApi,
  viewset: string,
): Promise<Record<string, unknown>[]> {
  const { statements: current } = await api.accessPolicy(viewset);
  return current.map((statement) => {
    const actions = statement.action;
    const lists = Array.isArray(actions)
      ? actions.includes("list")
      : actions === "list" || actions === "*";
    return lists ? { ...statement, principal: "admin" } : statement;
  });
}
