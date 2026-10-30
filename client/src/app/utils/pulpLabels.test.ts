import { describe, expect, it } from "vitest";

import {
  diffLabels,
  joinKeyValueAsString,
  parseLabelInput,
  splitStringAsKeyValue,
} from "./pulpLabels";

describe("joinKeyValueAsString", () => {
  it("joins a key and value with =", () => {
    expect(joinKeyValueAsString({ key: "env", value: "prod" })).toBe(
      "env=prod",
    );
  });

  it("shows the key alone for a valueless label", () => {
    expect(joinKeyValueAsString({ key: "archived", value: null })).toBe(
      "archived",
    );
  });

  it("keeps an empty-string value as a trailing =", () => {
    expect(joinKeyValueAsString({ key: "env", value: "" })).toBe("env=");
  });
});

describe("splitStringAsKeyValue", () => {
  it("splits key=value", () => {
    expect(splitStringAsKeyValue("env=prod")).toEqual({
      key: "env",
      value: "prod",
    });
  });

  it("treats a bare key as valueless (null)", () => {
    expect(splitStringAsKeyValue("archived")).toEqual({
      key: "archived",
      value: null,
    });
  });

  it("splits on the first = so values may contain =", () => {
    expect(splitStringAsKeyValue("url=https://a?b=c")).toEqual({
      key: "url",
      value: "https://a?b=c",
    });
  });

  it("keeps a trailing = as an empty-string value", () => {
    expect(splitStringAsKeyValue("env=")).toEqual({ key: "env", value: "" });
  });

  it("trims surrounding whitespace from the key", () => {
    expect(splitStringAsKeyValue("  env = prod")).toEqual({
      key: "env",
      value: " prod",
    });
  });
});

describe("parseLabelInput", () => {
  it("parses a valid key=value", () => {
    expect(parseLabelInput("env=prod")).toEqual({ key: "env", value: "prod" });
  });

  it("parses a valueless key", () => {
    expect(parseLabelInput("archived")).toEqual({
      key: "archived",
      value: null,
    });
  });

  it("errors on an empty input", () => {
    expect(parseLabelInput("  ")).toEqual({
      error: "Enter a label as key or key=value",
    });
  });

  it("errors on a key with disallowed characters", () => {
    expect(parseLabelInput("bad key=x")).toEqual({
      error: "Key may use letters, digits, '_', '-' or '.'",
    });
  });
});

describe("diffLabels", () => {
  it("reports added and changed labels in toSet", () => {
    expect(diffLabels({ env: "dev" }, { env: "prod", team: "a" })).toEqual({
      toSet: [
        { key: "env", value: "prod" },
        { key: "team", value: "a" },
      ],
      toUnset: [],
    });
  });

  it("reports removed labels in toUnset", () => {
    expect(diffLabels({ env: "prod", team: "a" }, { env: "prod" })).toEqual({
      toSet: [],
      toUnset: ["team"],
    });
  });

  it("reports no changes when the draft matches the original", () => {
    expect(diffLabels({ env: "prod" }, { env: "prod" })).toEqual({
      toSet: [],
      toUnset: [],
    });
  });
});
