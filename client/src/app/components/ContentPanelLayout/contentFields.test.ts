import { describe, expect, it } from "vitest";

import { facts } from "./contentFields";

describe("facts", () => {
  it("keeps values that render and drops empty ones", () => {
    expect(
      facts({ A: "a", B: 0, C: null, D: undefined, E: "", F: false }),
    ).toEqual([
      { term: "A", value: "a" },
      { term: "B", value: 0 },
    ]);
  });
});
