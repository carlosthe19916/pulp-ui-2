import { describe, expect, it } from "vitest";

import { nevra, platformOf } from "@app/utils/pluginContentFormat";

describe("Content unit formatting", () => {
  it("formats a platform, empty when unknown", () => {
    expect(platformOf({ os: "linux", architecture: "arm64" })).toBe(
      "linux/arm64",
    );
    expect(platformOf({})).toBe("");
  });

  it("formats NEVRA, hiding a zero epoch", () => {
    const pkg = {
      name: "bash",
      version: "5.2",
      release: "3.fc40",
      arch: "x86_64",
    };
    expect(nevra({ ...pkg, epoch: "0" })).toBe("bash-5.2-3.fc40.x86_64");
    expect(nevra({ ...pkg, epoch: "1" })).toBe("bash-1:5.2-3.fc40.x86_64");
  });
});
