import { describe, expect, it } from "vitest";

import { groupStarts, pathSegments } from "./browseHelpers";

describe("Browse helpers", () => {
  it("marks the first row of each group", () => {
    expect(
      groupStarts({ rows: ["a", "a", "b", "b", "a"], groupBy: (row) => row }),
    ).toEqual([true, false, true, false, true]);
  });

  it("splits a path prefix into folders", () => {
    expect(pathSegments("")).toEqual([]);
    expect(pathSegments("isos/fedora/")).toEqual(["isos", "fedora"]);
  });
});
