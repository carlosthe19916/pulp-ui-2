import { describe, expect, it } from "vitest";

import {
  fqcn,
  groupStarts,
  isMultiArch,
  pathSegments,
  pullCommand,
  severityColor,
  snapshotBuild,
  sourcesLine,
} from "./browseHelpers";

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

  it("names a collection by its FQCN", () => {
    expect(fqcn({ namespace: "ansible", name: "posix" })).toBe("ansible.posix");
  });

  it("detects multi-arch images and builds the pull command", () => {
    expect(isMultiArch({ listed_manifests: ["/m/1/"] })).toBe(true);
    expect(isMultiArch({ listed_manifests: [] })).toBe(false);
    expect(pullCommand({ registryPath: "host/repo", tag: "1.0" })).toBe(
      "podman pull host/repo:1.0",
    );
  });

  it("colors advisory severity without red", () => {
    expect(severityColor("Critical")).toBe("orange");
    expect(severityColor(undefined)).toBe("grey");
  });

  it("builds the apt sources line", () => {
    expect(
      sourcesLine({
        baseUrl: "https://host/deb/",
        codename: "noble",
        components: ["main", "universe"],
      }),
    ).toBe("deb https://host/deb/ noble main universe");
  });

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
