import { describe, expect, it } from "vitest";

import { buildTaskHref } from "./tasks";

describe("buildTaskHref", () => {
  it("builds a domain-scoped task href when domains are enabled", () => {
    expect(buildTaskHref("abc-123", { enabled: true, name: "myd" })).toBe(
      "/pulp/myd/api/v3/tasks/abc-123/",
    );
  });

  it("omits the domain segment when domains are disabled", () => {
    expect(buildTaskHref("abc-123", { enabled: false, name: "default" })).toBe(
      "/pulp/api/v3/tasks/abc-123/",
    );
  });
});
