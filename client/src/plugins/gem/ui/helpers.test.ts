import { describe, expect, it } from "vitest";

import { gemInstall } from "./helpers";

describe("Gem browse helpers", () => {
  it("installs from the served source", () => {
    expect(gemInstall("https://host/gems/")).toBe(
      "gem install --source https://host/gems/ <gem>",
    );
  });
});
