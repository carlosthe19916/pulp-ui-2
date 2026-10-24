import { describe, expect, it } from "vitest";

import { extractTaskDomain, extractTaskId } from "./taskHref";

describe("taskHref helpers", () => {
  it("extracts the trailing task id from a pulp_href", () => {
    expect(
      extractTaskId(
        "/api/pulp/default/api/v3/tasks/00000000-0000-0000-0000-000000000001/",
      ),
    ).toBe("00000000-0000-0000-0000-000000000001");
  });

  it("extracts the domain segment from a task href", () => {
    expect(extractTaskDomain("/api/pulp/mydomain/api/v3/tasks/abc-123/")).toBe(
      "mydomain",
    );
  });

  it("falls back to the default domain for the domains-disabled form", () => {
    expect(extractTaskDomain("/api/pulp/api/v3/tasks/abc-123/")).toBe(
      "default",
    );
  });
});
