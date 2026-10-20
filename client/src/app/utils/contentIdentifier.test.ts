import { describe, expect, it } from "vitest";

import { contentIdentifier } from "./contentIdentifier";

describe("contentIdentifier", () => {
  it("prefers relative_path when present", () => {
    expect(
      contentIdentifier({
        relative_path: "path/to/file.txt",
        name: "ignored",
        pulp_href: "/api/pulp/default/api/v3/content/file/files/abc/",
      }),
    ).toBe("path/to/file.txt");
  });

  it("falls back to name when relative_path is missing", () => {
    expect(
      contentIdentifier({
        name: "my-package",
        pulp_href: "/api/pulp/default/api/v3/content/rpm/packages/abc/",
      }),
    ).toBe("my-package");
  });

  it("falls back to the id from the href when no relative_path or name", () => {
    expect(
      contentIdentifier({
        pulp_href: "/api/pulp/default/api/v3/content/file/files/abc123/",
      }),
    ).toBe("abc123");
  });

  it("returns an em dash when nothing identifies the unit", () => {
    expect(contentIdentifier({})).toBe("—");
  });

  it("ignores empty-string values", () => {
    expect(
      contentIdentifier({
        relative_path: "",
        name: "",
        pulp_href: "/content/file/files/xyz/",
      }),
    ).toBe("xyz");
  });
});
