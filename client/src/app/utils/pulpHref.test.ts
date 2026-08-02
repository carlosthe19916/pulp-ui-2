import { describe, expect, it } from "vitest";

import {
  buildGroupHref,
  buildRoleHref,
  buildUserHref,
  extractIdFromHref,
} from "./pulpHref";

describe("pulpHref helpers", () => {
  it("builds domain-scoped hrefs", () => {
    expect(buildUserHref("42")).toContain("/users/42/");
    expect(buildGroupHref("7")).toContain("/groups/7/");
    expect(buildRoleHref("abc")).toContain("/roles/abc/");
  });

  it("extracts the trailing id from a pulp_href", () => {
    expect(extractIdFromHref("/api/pulp/default/api/v3/users/42/")).toBe("42");
  });
});
