import { describe, expect, it } from "vitest";

import { apiUrl } from "./useCommandContext";

const domain = { enabled: true, name: "default" };

describe("apiUrl", () => {
  it("reads endpoints of the domain, outside it, and pulp_hrefs", () => {
    expect(apiUrl({ path: "tasks", domain })).toBe(
      "/api/pulp/default/api/v3/tasks/",
    );
    expect(apiUrl({ path: "status/", domain })).toBe(
      "/api/pulp/api/v3/status/",
    );
    const href = "/api/pulp/default/api/v3/repositories/rpm/rpm/0193/";
    expect(apiUrl({ path: `${href}versions/`, domain })).toBe(
      `${href}versions/`,
    );
  });

  it.each([
    "https://evil.example.com/",
    "//evil.example.com/",
    "../admin/",
    "/login/",
    "tasks/?state=failed",
  ])("refuses %s", (path) => {
    expect(apiUrl({ path, domain })).toBe(undefined);
  });
});
