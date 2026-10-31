import { describe, expect, it } from "vitest";

import { sourcesLine } from "./helpers";

describe("Debian Browse helpers", () => {
  it("builds the apt sources line", () => {
    expect(
      sourcesLine({
        baseUrl: "https://host/deb/",
        codename: "noble",
        components: ["main", "universe"],
      }),
    ).toBe("deb https://host/deb/ noble main universe");
  });
});
