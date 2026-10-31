import { describe, expect, it } from "vitest";

import { isMultiArch, pullCommand } from "./helpers";

describe("Container browse helpers", () => {
  it("detects multi-arch images and builds the pull command", () => {
    expect(isMultiArch({ listed_manifests: ["/m/1/"] })).toBe(true);
    expect(isMultiArch({ listed_manifests: [] })).toBe(false);
    expect(pullCommand({ registryPath: "host/repo", tag: "1.0" })).toBe(
      "podman pull host/repo:1.0",
    );
  });
});
