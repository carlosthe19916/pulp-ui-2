import { describe, expect, it } from "vitest";

import { guardHasRoleEndpoints, guardTypeOf } from "./guardTypes";

describe("guardTypeOf", () => {
  it("resolves a guard's type from its href", () => {
    expect(
      guardTypeOf("/pulp/default/api/v3/contentguards/certguard/x509/0190-ab/")
        ?.pulpType,
    ).toBe("certguard.x509");
    expect(
      guardTypeOf("/pulp/api/v3/contentguards/core/rbac/0190-ab/")
        ?.downloaderRole,
    ).toBe(true);
  });

  it("is undefined for an unknown type", () => {
    expect(guardTypeOf("/pulp/api/v3/contentguards/x/y/1/")).toBeUndefined();
  });
});

describe("guardHasRoleEndpoints", () => {
  it("is true for core guards (they have role endpoints)", () => {
    expect(
      guardHasRoleEndpoints("/pulp/api/v3/contentguards/core/rbac/0190-ab/"),
    ).toBe(true);
    expect(
      guardHasRoleEndpoints(
        "/pulp/api/v3/contentguards/core/composite/0190-ab/",
      ),
    ).toBe(true);
  });

  it("is false for certguard and unknown guards (no role endpoints)", () => {
    expect(
      guardHasRoleEndpoints(
        "/pulp/api/v3/contentguards/certguard/x509/0190-ab/",
      ),
    ).toBe(false);
    expect(guardHasRoleEndpoints("/pulp/api/v3/contentguards/x/y/1/")).toBe(
      false,
    );
    expect(guardHasRoleEndpoints(undefined)).toBe(false);
  });
});
