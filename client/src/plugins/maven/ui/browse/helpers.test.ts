import { describe, expect, it } from "vitest";

import { snapshotBuild } from "./helpers";

describe("Maven browse helpers", () => {
  it("extracts the newest SNAPSHOT build", () => {
    expect(snapshotBuild({ version: "1.3", release: "1.3" })).toBe("");
    expect(
      snapshotBuild({
        version: "1.1-SNAPSHOT",
        release: "1.1-20261022.101500-4",
      }),
    ).toBe("20261022.101500-4");
  });
});
