import { describe, expect, it } from "vitest";

import { parseArgs, tokenize } from "./tokenize";

describe("tokenize", () => {
  it("splits on spaces and keeps quoted words together", () => {
    expect(tokenize(`pulp task list --name "a b" --x 'c d'`)).toEqual([
      "pulp",
      "task",
      "list",
      "--name",
      "a b",
      "--x",
      "c d",
    ]);
  });
});

describe("parseArgs", () => {
  it("separates words, flags and help", () => {
    expect(
      parseArgs(["rpm", "list", "--name", "x", "--limit=5", "-h"]),
    ).toEqual({
      words: ["rpm", "list"],
      flags: { name: "x", limit: "5" },
      help: true,
    });
  });
});
