import { describe, expect, it } from "vitest";

import { pipInstall } from "./helpers";

describe("Python Browse helpers", () => {
  it("installs from the index's simple API", () => {
    expect(pipInstall("https://host/pypi/foo/")).toBe(
      "pip install --index-url https://host/pypi/foo/simple/ <package>",
    );
  });
});
