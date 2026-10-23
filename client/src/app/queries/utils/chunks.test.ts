import { describe, expect, it } from "vitest";

import { contentRange, planChunks } from "./chunks";

describe("planChunks", () => {
  it("splits a size into consecutive chunks", () => {
    expect(planChunks({ size: 10, chunkSize: 4 })).toEqual([
      { start: 0, end: 4 },
      { start: 4, end: 8 },
      { start: 8, end: 10 },
    ]);
  });

  it("returns one chunk for a small file and none for an empty one", () => {
    expect(planChunks({ size: 3, chunkSize: 4 })).toEqual([
      { start: 0, end: 3 },
    ]);
    expect(planChunks({ size: 0, chunkSize: 4 })).toEqual([]);
  });
});

describe("contentRange", () => {
  it("uses an inclusive last byte", () => {
    expect(contentRange({ chunk: { start: 0, end: 2000 }, size: 3000 })).toBe(
      "bytes 0-1999/3000",
    );
  });
});
