import { expect, test } from "@support/fixtures";
import { uniqueName } from "@support/helpers/unique";

// The server's accept/reject rules for groups and their membership, over REST.

const errorText = (body: unknown): string => JSON.stringify(body);

test.describe("Groups API contract", () => {
  test("name rules (unique, bounded, non-blank)", async ({ api, cleanup }) => {
    const existing = cleanup.group(uniqueName("group"));
    await api.createGroup(existing);

    await test.step("duplicate → not unique", async () => {
      const r = await api.attemptCreate("groups", { name: existing });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain("This field must be unique.");
    });
    await test.step("only spaces → blank", async () => {
      const r = await api.attemptCreate("groups", { name: "   " });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain("This field may not be blank.");
    });
    await test.step("151 characters → length", async () => {
      const r = await api.attemptCreate("groups", {
        name: uniqueName("g").padEnd(151, "x"),
      });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain(
        "Ensure this field has no more than 150 characters.",
      );
    });
  });

  test("membership add, no-op and unknown user", async ({ api, cleanup }) => {
    const group = await api.createGroup(cleanup.group(uniqueName("group")));
    const user = cleanup.user(uniqueName("user"));
    await api.createUser({ username: user });

    await test.step("adding a user succeeds", async () => {
      const r = await api.attempt("post", `${group.pulp_href}users/`, {
        username: user,
      });
      expect(r.status).toBe(201);
    });
    await test.step("adding the same user again is a no-op (not an error)", async () => {
      const r = await api.attempt("post", `${group.pulp_href}users/`, {
        username: user,
      });
      expect([201, 204]).toContain(r.status);
    });
    await test.step("an unknown user is rejected", async () => {
      const r = await api.attempt("post", `${group.pulp_href}users/`, {
        username: `${uniqueName("ghost")}`,
      });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain("Could not find user");
    });
  });

  test("deleting a group cascades its memberships", async ({
    api,
    cleanup,
  }) => {
    const group = await api.createGroup(uniqueName("group"));
    const user = cleanup.user(uniqueName("user"));
    await api.createUser({ username: user });
    await api.addGroupMember(group.name, user);
    await api.attempt("delete", group.pulp_href);
    // The user survives; the group (and its membership) is gone.
    expect(await api.group(group.name)).toBeUndefined();
    expect((await api.user(user))?.groups ?? []).toEqual([]);
  });
});
