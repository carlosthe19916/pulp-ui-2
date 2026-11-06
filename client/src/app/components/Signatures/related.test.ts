import { describe, expect, it } from "vitest";

import { embeddedKeysEmptyText, lookupScope } from "./related";

describe("embeddedKeysEmptyText", () => {
  it("tells an unsigned package from one whose keys Pulp didn't record", () => {
    expect(embeddedKeysEmptyText([])).toBe("Unsigned package");
    expect(embeddedKeysEmptyText(null)).toBe("No signing keys recorded");
  });
});

describe("lookupScope", () => {
  it("names the version when there is one, else the domain", () => {
    expect(lookupScope("/versions/1/")).toBe("this repository version");
    expect(lookupScope()).toBe("this domain");
  });
});
