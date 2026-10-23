import { describe, expect, it } from "vitest";

import { notInVersionQuery } from "./notInVersionQuery";

const target = "/repositories/file/file/0190/versions/2/";
const source = "/repositories/file/file/0191/versions/5/";

describe("notInVersionQuery", () => {
  it("negates the repository_version filter", () => {
    expect(notInVersionQuery({ notInVersionHref: target })).toBe(
      `NOT repository_version="${target}"`,
    );
  });

  it("limits to another version's content in the same expression", () => {
    expect(
      notInVersionQuery({ notInVersionHref: target, inVersionHref: source }),
    ).toBe(
      `repository_version="${source}" AND NOT repository_version="${target}"`,
    );
  });
});
