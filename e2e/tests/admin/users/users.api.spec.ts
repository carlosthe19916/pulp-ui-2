import { expect, test } from "../../fixtures";
import { STRONG_PASSWORD, uniqueName } from "../../helpers/unique";

// Contract tests: the server's own accept/reject rules for users, checked over
// REST (no browser). The UI only has to *show* a server error, which is a form
// component test plus one generic e2e check.

/** Flatten a DRF error body so a message can be matched regardless of its field. */
const errorText = (body: unknown): string => JSON.stringify(body);

test.describe("Users API contract", () => {
  test("USR-CRE-02 username rules (unique, bounded, non-blank)", async ({
    api,
    cleanup,
  }) => {
    const existing = cleanup.user(uniqueName("user"));
    await api.createUser({ username: existing });

    await test.step("a duplicate is rejected as not unique", async () => {
      const r = await api.attemptCreate("users", {
        username: existing,
        password: STRONG_PASSWORD,
      });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain("This field must be unique.");
    });

    await test.step("only spaces is rejected as blank (Pulp trims)", async () => {
      const r = await api.attemptCreate("users", {
        username: "        ",
        password: STRONG_PASSWORD,
      });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain("This field may not be blank.");
    });

    await test.step("151 characters is rejected on length", async () => {
      const r = await api.attemptCreate("users", {
        username: `${uniqueName("u")}`.padEnd(151, "x"),
        password: STRONG_PASSWORD,
      });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain(
        "Ensure this field has no more than 150 characters.",
      );
    });

    await test.step("150 characters is accepted", async () => {
      const name = cleanup.user(`${uniqueName("u")}`.padEnd(150, "x"));
      const r = await api.attemptCreate("users", {
        username: name,
        password: STRONG_PASSWORD,
      });
      expect(r.status).toBe(201);
    });
  });

  test("USR-CRE-03 password rules", async ({ api, cleanup }) => {
    for (const [label, password, message] of [
      ["too common", "password", "This password is too common."],
      ["entirely numeric", "12345678", "This password is entirely numeric."],
      ["only spaces", "        ", "This field may not be blank."],
    ] as const) {
      await test.step(`${label} is rejected`, async () => {
        const r = await api.attemptCreate("users", {
          username: cleanup.user(uniqueName("user")),
          password,
        });
        expect(r.status).toBe(400);
        expect(errorText(r.body)).toContain(message);
      });
    }
  });

  test("USR-CRE-04 email rules", async ({ api, cleanup }) => {
    await test.step("an address without a TLD is rejected", async () => {
      const r = await api.attemptCreate("users", {
        username: cleanup.user(uniqueName("user")),
        password: STRONG_PASSWORD,
        email: "alice@example",
      });
      expect(r.status).toBe(400);
      expect(errorText(r.body)).toContain("Enter a valid email address.");
    });

    await test.step("alice@localhost is accepted", async () => {
      const r = await api.attemptCreate("users", {
        username: cleanup.user(uniqueName("user")),
        password: STRONG_PASSWORD,
        email: "alice@localhost",
      });
      expect(r.status).toBe(201);
    });

    await test.step("a reused email is accepted (emails need not be unique)", async () => {
      const email = `${uniqueName("dup")}@example.com`;
      await api.createUser({
        username: cleanup.user(uniqueName("user")),
        email,
      });
      const r = await api.attemptCreate("users", {
        username: cleanup.user(uniqueName("user")),
        password: STRONG_PASSWORD,
        email,
      });
      expect(r.status).toBe(201);
    });
  });
});
