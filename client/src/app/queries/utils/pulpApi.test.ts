import { describe, expect, it } from "vitest";

import { pulpApiPath, pulpHref, toProxyHref } from "./pulpApi";

describe("pulpApiPath", () => {
  const enabled = { enabled: true, name: "default" };
  const disabled = { enabled: false, name: "default" };

  it("accepts an endpoint with or without a leading slash", () => {
    expect(pulpApiPath("repositories/", disabled)).toBe(
      "/api/pulp/api/v3/repositories/",
    );
    expect(pulpApiPath("/repositories/", disabled)).toBe(
      "/api/pulp/api/v3/repositories/",
    );
    expect(pulpApiPath("//repositories/", disabled)).toBe(
      "/api/pulp/api/v3/repositories/",
    );
  });

  it("inserts the domain segment when the domain is enabled", () => {
    expect(pulpApiPath("/repositories/", enabled)).toBe(
      "/api/pulp/default/api/v3/repositories/",
    );
  });

  it("preserves the trailing slash as-is", () => {
    expect(pulpApiPath("tasks/purge/", disabled)).toBe(
      "/api/pulp/api/v3/tasks/purge/",
    );
  });
});

describe("pulpHref", () => {
  it("builds the server-form href under API_ROOT", () => {
    expect(
      pulpHref("repositories/file/file/abc/", { enabled: true, name: "d1" }),
    ).toBe("/pulp/d1/api/v3/repositories/file/file/abc/");
    expect(pulpHref("/tasks/abc/", { enabled: false, name: "default" })).toBe(
      "/pulp/api/v3/tasks/abc/",
    );
  });

  it("proxies to the same URL pulpApiPath builds", () => {
    const domain = { enabled: true, name: "d1" };
    expect(toProxyHref(pulpHref("remotes/rpm/rpm/x/", domain))).toBe(
      pulpApiPath("remotes/rpm/rpm/x/", domain),
    );
  });
});
