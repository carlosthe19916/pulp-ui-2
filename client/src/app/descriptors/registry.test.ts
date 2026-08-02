import { beforeEach, describe, expect, it } from "vitest";

import { fileContentDescriptor } from "./file/file-content";
import { fileDistributionDescriptor } from "./file/file-distribution";
import { fileRemoteDescriptor } from "./file/file-remote";
import { fileRepositoryDescriptor } from "./file/file-repository";
import {
  getAllDescriptors,
  getDescriptor,
  getDescriptorsForKind,
  registerDescriptor,
} from "./registry";

describe("descriptor registry", () => {
  beforeEach(() => {
    // Re-register into the shared map; keys overwrite cleanly per kind+type.
    registerDescriptor(fileRepositoryDescriptor);
    registerDescriptor(fileRemoteDescriptor);
    registerDescriptor(fileContentDescriptor);
    registerDescriptor(fileDistributionDescriptor);
  });

  it("stores descriptors under a kind+pulpType composite key", () => {
    expect(getDescriptor("repository", "file.file")?.kind).toBe("repository");
    expect(getDescriptor("remote", "file.file")?.kind).toBe("remote");
    expect(getDescriptor("content", "file.file")?.kind).toBe("content");
  });

  it("does not collide when pulp_type is shared across kinds", () => {
    const kinds = getAllDescriptors()
      .filter((d) => d.pulpType === "file.file")
      .map((d) => d.kind);
    expect(kinds).toEqual(
      expect.arrayContaining(["repository", "remote", "content"]),
    );
  });

  it("filters by kind", () => {
    expect(
      getDescriptorsForKind("repository").every((d) => d.kind === "repository"),
    ).toBe(true);
  });

  it("returns undefined for unknown types", () => {
    expect(getDescriptor("repository", "rpm.package")).toBeUndefined();
  });

  it("exposes browse presentation fields for file distribution and content", () => {
    expect(
      getDescriptor("distribution", "file.file")?.browseCardFields?.length,
    ).toBeGreaterThan(0);
    expect(
      getDescriptor("content", "file.file")?.browseDetailFields?.length,
    ).toBeGreaterThan(0);
  });
});
