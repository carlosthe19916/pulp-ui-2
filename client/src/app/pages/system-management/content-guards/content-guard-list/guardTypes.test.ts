import { describe, expect, it } from "vitest";

import { guardTypeOf } from "./guardTypes";

describe("guardTypeOf", () => {
  it("resolves a guard's type from its href", () => {
    expect(
      guardTypeOf("/pulp/default/api/v3/contentguards/certguard/x509/0190-ab/")
        ?.pulpType,
    ).toBe("certguard.x509");
    expect(
      guardTypeOf("/pulp/api/v3/contentguards/core/rbac/0190-ab/")?.hasAccess,
    ).toBe(true);
  });

  it("is undefined for an unknown type", () => {
    expect(guardTypeOf("/pulp/api/v3/contentguards/x/y/1/")).toBeUndefined();
  });
});
