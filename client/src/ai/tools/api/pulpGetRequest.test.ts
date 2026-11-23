import { describe, expect, it } from "vitest";

import { boundedParams, resolveApiUrl } from "./pulpGetRequest";

const domain = { enabled: true, name: "default" };

describe("resolveApiUrl", () => {
  it("reads an endpoint of the domain", () => {
    expect(resolveApiUrl({ path: "content/rpm/packages/", domain })).toBe(
      "/api/pulp/default/api/v3/content/rpm/packages/",
    );
  });

  it("adds the trailing slash Pulp needs", () => {
    expect(resolveApiUrl({ path: "remotes", domain })).toBe(
      "/api/pulp/default/api/v3/remotes/",
    );
  });

  it("reads endpoints outside any domain without one", () => {
    expect(resolveApiUrl({ path: "status/", domain })).toBe(
      "/api/pulp/api/v3/status/",
    );
  });

  it("reads a pulp_href and its sub-lists", () => {
    const href = "/api/pulp/default/api/v3/repositories/rpm/rpm/0193/";
    expect(resolveApiUrl({ path: href, domain })).toBe(href);
    expect(resolveApiUrl({ path: `${href}versions/`, domain })).toBe(
      `${href}versions/`,
    );
  });

  it.each([
    "https://evil.example.com/api/v3/",
    "//evil.example.com/",
    "../../admin/",
    "/api/pulp/default/api/v3/../../../etc/",
    "repositories/?name=x",
    "/login/",
    "content rpm",
  ])("refuses %s", (path) => {
    expect(resolveApiUrl({ path, domain })).toBe(undefined);
  });
});

describe("boundedParams", () => {
  it("defaults and caps the page size", () => {
    expect(boundedParams()).toEqual({ limit: 20 });
    expect(boundedParams({ limit: 5000, name: "x" })).toEqual({
      limit: 100,
      name: "x",
    });
  });
});
