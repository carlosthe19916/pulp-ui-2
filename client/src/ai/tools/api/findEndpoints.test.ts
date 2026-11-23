import { describe, expect, it } from "vitest";

import { findEndpoints } from "./findEndpoints";

describe("findEndpoints", () => {
  it("finds a plugin's content endpoint with its filters", () => {
    const [first] = findEndpoints("rpm packages");
    expect(first?.path).toBe("content/rpm/packages/");
    expect(first?.filters.split(" ")).toContain("name");
  });

  it("finds sub-lists of an object", () => {
    expect(findEndpoints("my permissions").map(({ path }) => path)).toContain(
      "{href}my_permissions/",
    );
  });

  it("finds nothing for unrelated words", () => {
    expect(findEndpoints("zzz qqq")).toEqual([]);
  });
});
