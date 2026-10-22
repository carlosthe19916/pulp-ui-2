import { describe, expect, it } from "vitest";

import { settleBatch } from "./settleBatch";

describe("settleBatch", () => {
  it("splits items by outcome, keeping order and each rejection", async () => {
    const error = new Error("x");
    const result = await settleBatch({
      items: ["a", "b", "c"],
      label: (item) => item.toUpperCase(),
      request: (item) =>
        item === "b" ? Promise.reject(error) : Promise.resolve(),
    });
    expect(result).toEqual({
      succeeded: ["A", "C"],
      failed: [{ label: "B", error }],
    });
  });

  it("returns empty sides for no items", async () => {
    const result = await settleBatch({
      items: [],
      label: String,
      request: () => Promise.resolve(),
    });
    expect(result).toEqual({ succeeded: [], failed: [] });
  });
});
