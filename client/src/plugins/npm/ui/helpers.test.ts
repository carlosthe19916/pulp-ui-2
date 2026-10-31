import { describe, expect, it } from "vitest";

import { npmInstall } from "./helpers";

describe("npm browse helpers", () => {
  it("installs from the served registry", () => {
    expect(npmInstall("https://host/npm/")).toBe(
      "npm install --registry https://host/npm/ <package>",
    );
  });
});
