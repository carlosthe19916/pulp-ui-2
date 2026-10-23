import { describe, expect, it } from "vitest";

import { contentUnitLabel } from "./contentUnitLabel";

describe("contentUnitLabel", () => {
  it("labels a content row by its identity", () => {
    const href = "/api/v3/content/x/y/0190abc/";
    expect(contentUnitLabel({ row: { relative_path: "a/b.txt" }, href })).toBe(
      "a/b.txt",
    );
    expect(
      contentUnitLabel({
        row: { name: "foo", version: "1.0", release: "1", arch: "x86_64" },
        href,
      }),
    ).toBe("foo-1.0-1.x86_64");
    expect(
      contentUnitLabel({
        row: { namespace: "ns", name: "coll", version: "2.0.0" },
        href,
      }),
    ).toBe("ns.coll-2.0.0");
    expect(contentUnitLabel({ row: { name: "latest" }, href })).toBe("latest");
    expect(contentUnitLabel({ row: { id: "RHSA-1" }, href })).toBe("RHSA-1");
    expect(contentUnitLabel({ row: {}, href })).toBe("0190abc");
  });
});
