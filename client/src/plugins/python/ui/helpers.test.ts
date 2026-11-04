import { describe, expect, it } from "vitest";

import { parseJsonField, pipInstall, projectUrls } from "./helpers";

describe("Python Browse helpers", () => {
  it("installs from the index's simple API", () => {
    expect(pipInstall("https://host/pypi/foo/")).toBe(
      "pip install --index-url https://host/pypi/foo/simple/ <package>",
    );
  });

  it("reads metadata fields Pulp returns as JSON-encoded strings", () => {
    expect(parseJsonField('["rich>=13"]')).toEqual(["rich>=13"]);
    expect(parseJsonField(["rich>=13"])).toEqual(["rich>=13"]);
    expect(parseJsonField("not json")).toBeUndefined();
  });

  it("labels project URLs from either metadata form", () => {
    expect(
      projectUrls(
        '["Documentation, https://rich.readthedocs.io/", "Homepage, https://github.com/Textualize/rich"]',
      ),
    ).toEqual({
      Documentation: "https://rich.readthedocs.io/",
      Homepage: "https://github.com/Textualize/rich",
    });
    expect(projectUrls({ Source: "https://example.com" })).toEqual({
      Source: "https://example.com",
    });
    expect(projectUrls(null)).toEqual({});
  });
});
