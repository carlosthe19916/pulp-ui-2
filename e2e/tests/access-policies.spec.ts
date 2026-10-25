import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import type { PulpApi } from "./helpers/pulp-api";
import type { AccessPoliciesPage } from "./pom/AccessPoliciesPage";
import { DataTable } from "./pom/DataTable";

// Every test here edits or resets a policy, which changes server-wide behaviour:
// run them in order in one worker ("default" opts out of fullyParallel without
// skipping the rest after a failure, as "serial" would), and
// `cleanup.accessPolicy` resets each policy in teardown.
test.describe.configure({ mode: "default" });

// Viewsets no other admin test relies on, so a broken policy can't leak into them.
const V_BREAK = "content/ostree/summaries"; // also its collection path
const V_HOOKS = "remotes/ansible/role"; // has creation hooks and queryset scoping
const V_EDIT = "remotes/ansible/git";
const V_LIST = "publications/deb/verbatim";
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
    test("ACP-LIST-01 page content", async ({
      accessPoliciesPage: acp,
      page,
    }) => {
      await expect(acp.heading).toBeVisible();
      await expect(
        page.getByText(
          "Each policy decides who may call one API endpoint. Changing them is advanced; reset a policy to restore its plugin's default.",
        ),
      ).toBeVisible();
      await acp.list.expectLoaded();
      await expect(acp.list.rows).toHaveCount(20);
      await expect(acp.list.paginator().toggle).toHaveText(
        /^1 - 20 of \d+\s*$/,
      );
      await expect(
        page.getByRole("main").getByRole("button", { name: /create/i }),
      ).toHaveCount(0);
      await acp.list.rows
        .first()
        .getByRole("button", { name: "Kebab toggle" })
        .click();
      await expect(page.getByRole("menuitem")).toHaveText([
        "Edit",
        "Reset to default",
      ]);
    });

    const rowCases = [
      { status: "default", n: undefined, label: "Default" },
      { status: "customized", n: 1, label: "Customized" },
      { status: "customized", n: 3, label: "Customized" },
    ] as const;
    test("ACP-LIST-02 row content", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
      page,
    }) => {
      test.slow();
      cleanup.accessPolicy(V_LIST);
      for (const { status, n, label } of rowCases) {
        await test.step(`${status} with ${n ?? "≥1"} statements`, async () => {
          if (n !== undefined) {
            await api.updateAccessPolicy(V_LIST, { statements: statements(n) });
          }
          // Reload so the list reflects this row's policy state and the filter
          // from the previous step is cleared.
          await acp.page.reload();
          await acp.find(V_LIST);
          const viewsetCell = cell(acp, V_LIST, 0);
          await expect(viewsetCell).toHaveText(V_LIST);
          await expect(viewsetCell.getByRole("link")).toHaveCount(0);
          if (n === undefined) {
            const count = Number(await cell(acp, V_LIST, 1).innerText());
            expect(count).toBeGreaterThanOrEqual(1);
          }
          await expectStatus(acp, V_LIST, { status: label, statements: n });
          await openRowMenu(acp, V_LIST);
          await expect(page.getByRole("menuitem")).toHaveText([
            "Edit",
            "Reset to default",
          ]);
        });
      }
    });

    test("ACP-LIST-03 status sort ascending: customized after every default", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
    }) => {
      cleanup.accessPolicy(V_LIST);
      await api.updateAccessPolicy(V_LIST, { statements: statements(1) });
      await acp.page.reload();
      await acp.list.expectLoaded();
      await acp.list.sortBy("Status");
      await acp.list.expectSorted("Status", "ascending");
      expect(new Set(await acp.list.columnTexts("Status"))).toEqual(
        new Set(["Default"]),
      );
      await acp.list.paginator().last().click();
      await expect(acp.exactRow(V_LIST)).toBeVisible();
      const statuses = await acp.list.columnTexts("Status");
      const firstCustomized = statuses.indexOf("Customized");
      expect(statuses.slice(firstCustomized)).not.toContain("Default");
    });

    test("ACP-LIST-03 status sort descending: customized before every default", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
    }) => {
      cleanup.accessPolicy(V_LIST);
      await api.updateAccessPolicy(V_LIST, { statements: statements(1) });
      await acp.page.reload();
      await acp.list.expectLoaded();
      await acp.list.sortBy("Status");
      await acp.list.sortBy("Status");
      await acp.list.expectSorted("Status", "descending");
      await expect(acp.exactRow(V_LIST)).toBeVisible();
      const statuses = await acp.list.columnTexts("Status");
      expect(statuses[0]).toBe("Customized");
      const firstDefault = statuses.indexOf("Default");
      if (firstDefault >= 0) {
        expect(statuses.slice(firstDefault)).not.toContain("Customized");
      }
    });
  });

  test.describe("Edit", () => {
    test("ACP-EDT-01 form shows the saved values and help", async ({
      accessPoliciesPage: acp,
      api,
      page,
    }) => {
      const saved = await api.accessPolicy(V_HOOKS);
      await acp.find(V_HOOKS);
      const modal = await acp.openEdit(V_HOOKS);
      await expect(modal.field("Statements")).toHaveValue(
        json(saved.statements),
      );
      await expect(modal.field("Creation hooks")).toHaveValue(
        json(saved.creation_hooks),
      );
      await expect(modal.field("Queryset scoping")).toHaveValue(
        json(saved.queryset_scoping),
      );
      const help = {
        Statements:
          "The list of allow/deny statements evaluated for each request.",
        "Creation hooks":
          "Roles granted when an object of this viewset is created.",
        "Queryset scoping": "How lists are narrowed to what the user may see.",
      };
      for (const [label, text] of Object.entries(help)) {
        await test.step(label, async () => {
          await modal.button(`More info for ${label}`).click();
          await expect(page.getByText(text, { exact: true })).toBeVisible();
          await modal.button(`More info for ${label}`).click();
        });
      }
      await modal.close("Cancel");

      // A policy without creation hooks shows that field empty.
      await acp.find(V_BREAK);
      const empty = await acp.openEdit(V_BREAK);
      await expect(empty.field("Creation hooks")).toHaveValue("");
      await empty.close("Cancel");
    });

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
    const BAD_CONDITION = [{ ...ALLOW, condition: "no_such_condition" }];
    const validationRows: IValidationRow[] = [
      {
        field: "Statements",
        label: "(empty)",
        viewset: V_BREAK,
        value: () => "",
        outcome: { kind: "client", error: "Statements is required" },
      },
      {
        field: "Statements",
        label: "[",
        viewset: V_BREAK,
        value: () => "[",
        outcome: { kind: "client", error: "Statements must be valid JSON" },
      },
      // Malformed JSON that the server rejects ({}, ["x"], null hooks) are
      // contract tests: tests/api/access-policies.api.spec.ts.
      {
        field: "Statements",
        label: "the saved value, unchanged",
        viewset: V_BREAK,
        value: (saved) => json(saved.statements),
        outcome: { kind: "saved" },
      },
      {
        field: "Statements",
        label: "one valid allow statement",
        viewset: V_BREAK,
        value: () => json([ALLOW]),
        outcome: { kind: "saved" },
      },
      {
        field: "Statements",
        label: "[] (denies everyone)",
        viewset: V_BREAK,
        value: () => "[]",
        outcome: { kind: "broken", listStatus: 403 },
      },
      {
        field: "Statements",
        label: "an unknown condition",
        viewset: V_BREAK,
        value: () => json(BAD_CONDITION),
        outcome: { kind: "broken", listStatus: 500 },
      },
      {
        field: "Statements",
        label: "a statement without principal or action",
        viewset: V_BREAK,
        value: () => json([{ effect: "allow" }]),
        outcome: { kind: "broken", listStatus: 500 },
      },
      {
        field: "Creation hooks",
        label: "(empty)",
        viewset: V_HOOKS,
        value: () => "",
        outcome: { kind: "kept", field: "creation_hooks" },
      },
      {
        field: "Creation hooks",
        label: "[",
        viewset: V_HOOKS,
        value: () => "[",
        outcome: { kind: "client", error: "Creation hooks must be valid JSON" },
      },
      {
        field: "Creation hooks",
        label: "[]",
        viewset: V_HOOKS,
        value: () => "[]",
        outcome: { kind: "emptied" },
      },
      {
        field: "Queryset scoping",
        label: "(empty)",
        viewset: V_HOOKS,
        value: () => "",
        outcome: { kind: "kept", field: "queryset_scoping" },
      },
      {
        field: "Queryset scoping",
        label: "[",
        viewset: V_HOOKS,
        value: () => "[",
        outcome: {
          kind: "client",
          error: "Queryset scoping must be valid JSON",
        },
      },
      {
        field: "Queryset scoping",
        label: "{}",
        viewset: V_BREAK,
        value: () => "{}",
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

    test("ACP-EDT-02 JSON validation for every field", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
      page,
      toasts,
    }) => {
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
    });

    test("ACP-EDT-03 a successful save", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
      page,
      toasts,
    }) => {
      test.slow();
      cleanup.accessPolicy(V_EDIT);
      for (const k of [1, 3]) {
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
    });

    test("ACP-EDT-04 several invalid fields at once", async ({
      accessPoliciesPage: acp,
    }) => {
      await acp.find(V_HOOKS);
      const modal = await acp.openEdit(V_HOOKS);
      await modal.field("Statements").fill("[");
      await modal.field("Creation hooks").fill("[");
      await modal.button("Save").click();
      await expect(
        modal.dialog.getByText("Statements must be valid JSON"),
      ).toBeVisible();
      await expect(
        modal.dialog.getByText("Creation hooks must be valid JSON"),
      ).toBeVisible();
      await modal.close("Cancel");
    });

    const clearCases = [
      { field: "Creation hooks", key: "creation_hooks" },
      { field: "Queryset scoping", key: "queryset_scoping" },
    ] as const;
    test("ACP-EDT-05 clearing an optional field keeps the saved value", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
      toasts,
    }) => {
      test.slow();
      cleanup.accessPolicy(V_HOOKS);
      for (const { field, key } of clearCases) {
        await test.step(`clearing ${field}`, async () => {
          // Steps share V_HOOKS, so reset to the default before each.
          await api.resetAccessPolicy(V_HOOKS);
          const saved = await api.accessPolicy(V_HOOKS);
          expect(saved[key]).not.toBeNull();
          await acp.page.reload();
          await acp.find(V_HOOKS);
          const modal = await acp.openEdit(V_HOOKS);
          await modal.field(field).fill("");
          await modal.button("Save").click();
          await expect(
            toasts.success(`Policy "${V_HOOKS}" saved`),
          ).toBeVisible();
          expect((await api.accessPolicy(V_HOOKS))[key]).toEqual(saved[key]);

          if (key === "creation_hooks") {
            // Typing [] instead removes the hooks.
            const again = await acp.openEdit(V_HOOKS);
            await again.field(field).fill("[]");
            await again.button("Save").click();
            await again.expectClosed();
            await expect
              .poll(
                async () => (await api.accessPolicy(V_HOOKS)).creation_hooks,
              )
              .toEqual([]);
          } else {
            // Only "Reset to default" restores the default scoping.
            await api.updateAccessPolicy(V_HOOKS, {
              queryset_scoping: { function: "scope_queryset" },
            });
            await api.resetAccessPolicy(V_HOOKS);
            expect((await api.accessPolicy(V_HOOKS)).queryset_scoping).toEqual(
              saved.queryset_scoping,
            );
          }
        });
      }
    });

    test("ACP-EDT-06 the server error clears on close", async ({
      accessPoliciesPage: acp,
    }) => {
      await acp.find(V_BREAK);
      const modal = await acp.openEdit(V_BREAK);
      await modal.field("Statements").fill("{}");
      await modal.button("Save").click();
      await modal.expectSubmitError(
        'Expected a list of items but got type "dict".',
      );
      await modal.close("Cancel");
      const again = await acp.openEdit(V_BREAK);
      await expect(again.submitError()).toHaveCount(0);
      await again.close("Cancel");
    });

    const editCases = [
      { status: "customized", change: "new statements" },
      { status: "customized", change: "nothing changed" },
      { status: "default", change: "nothing changed" },
    ] as const;
    test("ACP-EDT-07 editing an already customized policy", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
      toasts,
    }) => {
      test.slow();
      cleanup.accessPolicy(V_EDIT);
      for (const { status, change } of editCases) {
        await test.step(`${status} policy, ${change}`, async () => {
          // Steps share V_EDIT; reset first so each starts from a known state.
          await api.resetAccessPolicy(V_EDIT);
          if (status === "customized") {
            await api.updateAccessPolicy(V_EDIT, { statements: statements(1) });
          }
          await acp.page.reload();
          await acp.find(V_EDIT);
          const modal = await acp.openEdit(V_EDIT);
          const target =
            change === "new statements"
              ? statements(3)
              : (await api.accessPolicy(V_EDIT)).statements;
          if (change === "new statements") {
            await modal.field("Statements").fill(json(target));
          }
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
      }
    });
  });

  test.describe("Reset", () => {
    test("ACP-RST-01 reset is disabled for a default policy", async ({
      accessPoliciesPage: acp,
      page,
    }) => {
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
    });

    test("ACP-RST-01 reset is enabled for a customized policy", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
      page,
    }) => {
      cleanup.accessPolicy(V_RESET);
      await api.updateAccessPolicy(V_RESET, { statements: statements(1) });
      await acp.page.reload();
      await acp.find(V_RESET);
      await openRowMenu(acp, V_RESET);
      await expect(
        page.getByRole("menuitem", { name: "Reset to default" }),
      ).not.toHaveAttribute("aria-disabled", "true");
    });

    test("ACP-RST-02 reset restores the default", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
      page,
      toasts,
    }) => {
      cleanup.accessPolicy(V_RESET);
      const defaults = await api.accessPolicy(V_RESET);
      await api.updateAccessPolicy(V_RESET, {
        statements: statements(1),
        creation_hooks: [],
        queryset_scoping: { function: "scope_queryset" },
      });
      await acp.page.reload();
      await acp.find(V_RESET);
      await expectStatus(acp, V_RESET, { status: "Customized", statements: 1 });

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
    });

    test("ACP-RST-03 a failed reset", () => {
      test.skip(
        true,
        "Manual: a reset only fails for a policy whose plugin is no longer installed",
      );
    });
  });

  test.describe("Permissions", () => {
    test("ACP-PERM-01 only superusers can see or change access policies", async ({
      secondUser,
    }) => {
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
    });
  });

  test.describe("Effect", () => {
    const effectCases = [
      {
        page: "Tasks",
        viewset: "tasks",
        path: "/monitoring/default/tasks",
        grid: "Tasks table",
      },
      {
        page: "Repositories",
        viewset: "repositories",
        path: "/content-management/default/repositories",
        grid: "Repositories table",
      },
    ];
    test("ACP-EFF-01 a policy change takes effect", async ({
      accessPoliciesPage: acp,
      api,
      cleanup,
      secondUser,
    }) => {
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
          await expect(table.stateHeading("403: Access denied")).toHaveCount(0);

          const tightened = await adminOnlyList(api, row.viewset);
          // Reload the admin list so the filter from the previous step is cleared.
          await acp.goto();
          await acp.find(row.viewset);
          const modal = await acp.openEdit(row.viewset);
          await modal.field("Statements").fill(json(tightened));
          await modal.button("Save").click();
          await modal.expectClosed();

          await userPage.reload();
          await expect(table.stateHeading("403: Access denied")).toBeVisible();

          const dialog = await acp.openReset(row.viewset);
          await dialog.confirm("Reset");
          await userPage.reload();
          await table.expectLoaded();
          await expect(table.stateHeading("403: Access denied")).toHaveCount(0);
        });
      }
    });
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
