import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

// The server's accept/reject rules for roles, over REST.

const errorText = (body: unknown): string => JSON.stringify(body);
const VIEW_TASK = "core.view_task";
const LOCKED_ROLE = "core.task_owner";

test.describe("Roles API contract", () => {
  test("ROL-CRE-02 name is unique and has no length limit", async ({
    api,
    cleanup,
  }) => {
    const existing = await api.createRole({
      name: cleanup.role(uniqueName("role")),
    });

    await test.step("duplicate → not unique", async () => {
      const r = await api.attemptCreate("roles", {
        name: existing.name,
        permissions: [],
      });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain("This field must be unique.");
    });
    await test.step("a locked role's name → not unique", async () => {
      const r = await api.attemptCreate("roles", {
        name: LOCKED_ROLE,
        permissions: [],
      });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain("This field must be unique.");
    });
    await test.step("1000 characters → accepted (no length limit)", async () => {
      const r = await api.attemptCreate("roles", {
        name: cleanup.role(uniqueName("role").padEnd(1000, "x")),
        permissions: [],
      });
      expect(r.status).toBe(201);
    });
  });

  test("ROL-CRE-04 permission validation", async ({ api, cleanup }) => {
    for (const [label, permission, message] of [
      [
        "unknown codename",
        "core.not_a_permission",
        "Permission 'core.not_a_permission' does not exist.",
      ],
      [
        "no dot",
        "not-a-codename",
        "Permission 'not-a-codename' is not in the format '<app_label>.<codename>'.",
      ],
      [
        "wrong case",
        "Core.view_task",
        "Permission 'Core.view_task' does not exist.",
      ],
    ] as const) {
      await test.step(`${label} is rejected`, async () => {
        const r = await api.attemptCreate("roles", {
          name: cleanup.role(uniqueName("role")),
          permissions: [permission],
        });
        expect(r.status).toBe(400);
        expect(errorText(r.body)).toContain(message);
      });
    }
  });

  test("ROL-EDT-03 description clears only with null, not an empty string", async ({
    api,
    cleanup,
  }) => {
    const role = await api.createRole({
      name: cleanup.role(uniqueName("role")),
      description: "Seeded",
      permissions: [VIEW_TASK],
    });
    await test.step('"" is rejected', async () => {
      const r = await api.attempt("patch", role.pulp_href, { description: "" });
      expect(r.status).toBe(400);
    });
    await test.step("null clears it", async () => {
      const r = await api.attempt("patch", role.pulp_href, {
        description: null,
      });
      expect(r.status).toBe(200);
      expect((await api.role(role.name))?.description).toBeNull();
    });
  });

  test("ROL-LOCK-01 a locked role cannot be edited or deleted", async ({
    api,
  }) => {
    const locked = await api.role(LOCKED_ROLE);
    expect(locked).toBeTruthy();
    await test.step("edit → 403 locked", async () => {
      const r = await api.attempt("patch", locked!.pulp_href, {
        description: "x",
      });
      expect(r.status).toBe(403);
      expect(errorText(r.body)).toContain("The role is locked.");
    });
    await test.step("delete → 403 locked", async () => {
      const r = await api.attempt("delete", locked!.pulp_href);
      expect(r.status).toBe(403);
      expect(errorText(r.body)).toContain("The role is locked.");
    });
  });
});
