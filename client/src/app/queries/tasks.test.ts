import { describe, expect, it } from "vitest";

import { buildTaskHref, taskPollDelay } from "./tasks";

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

describe("taskPollDelay", () => {
  it("backs off by a second per check, up to the poll interval", () => {
    expect([1, 2, 3, 4, 5, 6, 20].map(taskPollDelay)).toEqual([
      1000, 2000, 3000, 4000, 5000, 5000, 5000,
    ]);
  });
});
