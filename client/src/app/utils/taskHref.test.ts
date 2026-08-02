import { describe, expect, it } from "vitest";

import { buildTaskHref, extractTaskId } from "./taskHref";

describe("taskHref helpers", () => {
  it("builds a domain-scoped task href", () => {
    expect(buildTaskHref("abc-123")).toContain("/tasks/abc-123/");
  });

  it("extracts the trailing task id from a pulp_href", () => {
    expect(
      extractTaskId(
        "/api/pulp/default/api/v3/tasks/00000000-0000-0000-0000-000000000001/",
      ),
    ).toBe("00000000-0000-0000-0000-000000000001");
  });
});
