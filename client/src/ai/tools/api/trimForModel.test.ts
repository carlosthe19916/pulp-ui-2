import { describe, expect, it } from "vitest";

import { trimForModel } from "./trimForModel";

describe("trimForModel", () => {
  it("keeps a small response as it is", () => {
    const page = { count: 1, results: [{ name: "seed-rpm" }] };
    expect(trimForModel(page)).toEqual(page);
  });

  it("cuts long strings", () => {
    const trimmed = trimForModel({ error: "x".repeat(1000) }) as {
      error: string;
    };
    expect(trimmed.error).toHaveLength(301);
  });

  it("drops rows to fit and says how many", () => {
    const results = Array.from({ length: 100 }, (_, index) => ({
      name: `repository-${index}`,
      description: "y".repeat(250),
    }));
    const trimmed = trimForModel({ count: 100, results }) as {
      results: unknown[];
      omittedRowsToFit: number;
    };
    expect(JSON.stringify(trimmed).length).toBeLessThanOrEqual(12_000);
    expect(trimmed.results.length + trimmed.omittedRowsToFit).toBe(100);
  });
});
