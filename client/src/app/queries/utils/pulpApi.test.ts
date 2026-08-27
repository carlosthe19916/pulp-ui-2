import { describe, expect, it } from "vitest";

import { pulpApiPath } from "./pulpApi";

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
