import { describe, expect, it } from "vitest";

import { summarizeUnits } from "./summarizeUnits";

const unit = (label: string, pulpType?: string) => ({
  href: `/${label}/`,
  label,
  pulpType,
});

describe("summarizeUnits", () => {
  it("groups by type in first-seen order and caps the names", () => {
    expect(
      summarizeUnits({
        units: [
          unit("a", "rpm.package"),
          unit("x", "rpm.advisory"),
          unit("b", "rpm.package"),
          unit("c", "rpm.package"),
        ],
        limit: 2,
      }),
    ).toEqual([
      { pulpType: "rpm.package", labels: ["a", "b"], more: 1 },
      { pulpType: "rpm.advisory", labels: ["x"], more: 0 },
    ]);
  });

  it("keeps untyped units (Browse rows) in one group", () => {
    expect(summarizeUnits({ units: [unit("a"), unit("b")] })).toEqual([
      { pulpType: undefined, labels: ["a", "b"], more: 0 },
    ]);
  });
});
