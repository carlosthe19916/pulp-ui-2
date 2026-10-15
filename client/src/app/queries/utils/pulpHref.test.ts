import { describe, expect, it } from "vitest";

import {
  buildGroupHref,
  buildUserHref,
  extractIdFromHref,
  resolvePulpType,
} from "./pulpHref";

describe("pulpHref helpers", () => {
  const enabled = { enabled: true, name: "default" };
  const disabled = { enabled: false, name: "default" };

  it("builds domain-scoped hrefs with the domain segment when enabled", () => {
    expect(buildUserHref("42", enabled)).toBe(
      "/api/pulp/default/api/v3/users/42/",
    );
    expect(buildGroupHref("7", enabled)).toBe(
      "/api/pulp/default/api/v3/groups/7/",
    );
  });

  it("omits the domain segment when the domain is disabled", () => {
    expect(buildUserHref("42", disabled)).toBe("/api/pulp/api/v3/users/42/");
    expect(buildGroupHref("7", disabled)).toBe("/api/pulp/api/v3/groups/7/");
  });

  it("extracts the trailing id from a pulp_href", () => {
    expect(extractIdFromHref("/api/pulp/default/api/v3/users/42/")).toBe("42");
  });

  it("resolves pulp_type from a resource href via the catalog", () => {
    // Typed families: <app>/<slug> maps to the catalog pulp_type.
    expect(
      resolvePulpType("/api/pulp/default/api/v3/repositories/file/file/abc/"),
    ).toBe("file.file");
    expect(resolvePulpType("/remotes/python/python/x/")).toBe("python.python");
    // Non-"doubled" slug — proves it reads the catalog, not a string transform.
    expect(resolvePulpType("/distributions/python/pypi/x/")).toBe(
      "python.pypi",
    );
    // Content: apiPath "file/files" maps to "file.file" (no de-pluralize hack).
    expect(
      resolvePulpType("/api/pulp/default/api/v3/content/file/files/abc/"),
    ).toBe("file.file");
  });

  it("returns undefined for falsy, untyped, or unmodelled hrefs", () => {
    expect(resolvePulpType(undefined)).toBeUndefined();
    expect(resolvePulpType("")).toBeUndefined();
    // Untyped/aggregate and non-content families.
    expect(
      resolvePulpType("/api/pulp/default/api/v3/users/42/"),
    ).toBeUndefined();
    expect(resolvePulpType("/repositories/")).toBeUndefined();
    // Family matches but the plugin is not in the catalog.
    expect(resolvePulpType("/repositories/bogus/bogus/x/")).toBeUndefined();
  });
});
