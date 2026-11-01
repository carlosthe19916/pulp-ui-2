import { describe, expect, it } from "vitest";

import { parseSearch, stringifySearch } from "./searchParams";

describe("parseSearch", () => {
  it("keeps every value a string, including ones that look like numbers or JSON", () => {
    expect(parseSearch("?page=2&name=123&raw=%7B%7D&flag=true")).toEqual({
      page: "2",
      name: "123",
      raw: "{}",
      flag: "true",
    });
  });

  it("turns a repeated name into an array", () => {
    expect(parseSearch("?pulp_type=file&pulp_type=rpm")).toEqual({
      pulp_type: ["file", "rpm"],
    });
  });

  it("returns an empty object for an empty query", () => {
    expect(parseSearch("")).toEqual({});
  });
});

describe("stringifySearch", () => {
  it("writes plain values and keeps dotted prefixes readable", () => {
    expect(stringifySearch({ page: 2, name: "123", "add.page": 3 })).toBe(
      "?page=2&name=123&add.page=3",
    );
  });

  it("writes arrays as repeated names", () => {
    expect(stringifySearch({ pulp_type: ["file", "rpm"] })).toBe(
      "?pulp_type=file&pulp_type=rpm",
    );
  });

  it("drops undefined, null, empty strings and empty arrays", () => {
    expect(
      stringifySearch({ a: undefined, b: null, c: "", d: [], e: "x" }),
    ).toBe("?e=x");
  });

  it("returns an empty string when nothing is left", () => {
    expect(stringifySearch({ a: undefined })).toBe("");
  });

  it("round-trips through parseSearch", () => {
    const search = { name: "a b&c", pulp_type: ["file", "rpm"], page: "3" };
    expect(parseSearch(stringifySearch(search))).toEqual(search);
  });
});
