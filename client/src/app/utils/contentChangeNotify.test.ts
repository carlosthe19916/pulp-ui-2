import { describe, expect, it } from "vitest";

import { contentChangeTitle } from "./contentChangeNotify";

const repo = "/api/pulp/default/api/v3/repositories/file/file/0190/";

describe("contentChangeTitle", () => {
  it("names the change and the repository", () => {
    expect(
      contentChangeTitle({
        repositoryName: "files",
        body: { remove_content_units: ["a", "b"] },
      }),
    ).toBe('Removing 2 units from "files"');
    expect(
      contentChangeTitle({
        repositoryName: "files",
        body: { add_content_units: ["a"] },
      }),
    ).toBe('Adding 1 unit to "files"');
    expect(
      contentChangeTitle({
        repositoryName: "files",
        body: { remove_content_units: ["*"] },
      }),
    ).toBe('Removing all content from "files"');
    expect(
      contentChangeTitle({
        repositoryName: "files",
        body: { base_version: `${repo}versions/3/` },
      }),
    ).toBe('Restoring version 3 of "files"');
  });

  it("falls back to a generic title for a mixed change", () => {
    expect(
      contentChangeTitle({
        repositoryName: "files",
        body: { add_content_units: ["a"], remove_content_units: ["b"] },
      }),
    ).toBe('Changing the content of "files"');
  });
});
