import { expect, test } from "@support/fixtures";

// The server's validation of access-policy edits, over REST. Only the *rejected*
// (400) shapes are tested here: they change nothing, so no policy is mutated and
// no reset is needed. The accepted-but-breaking values and reset flow stay in the
// serial e2e suite.

// Flatten the DRF error's string values (not JSON.stringify, which would escape
// the quotes in messages like `type "dict"`).
const errorText = (body: unknown): string => {
  const out: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(body);
  return out.join(" | ");
};

test.describe("Access policies API contract", () => {
  test("ACP-EDT-02 rejects malformed statements and creation hooks", async ({
    api,
  }) => {
    const { results } = await api.getJson<{ results: { pulp_href: string }[] }>(
      api.hrefOf("access_policies"),
      { limit: 1 },
    );
    const href = results[0].pulp_href;

    for (const [label, patch, message] of [
      [
        "statements not a list ({})",
        { statements: {} },
        'Expected a list of items but got type "dict".',
      ],
      [
        'a statement that is not an object (["x"])',
        { statements: ["x"] },
        'Expected a dictionary of items but got type "str".',
      ],
      [
        "creation hooks not a list ({})",
        { creation_hooks: {} },
        'Expected a list of items but got type "dict".',
      ],
      [
        "null creation hooks",
        { creation_hooks: null },
        "This field may not be null.",
      ],
    ] as const) {
      await test.step(`${label} is rejected`, async () => {
        const r = await api.attempt("patch", href, patch);
        expect(r.status).toBe(400);
        expect(errorText(r.body)).toContain(message);
      });
    }
  });
});
