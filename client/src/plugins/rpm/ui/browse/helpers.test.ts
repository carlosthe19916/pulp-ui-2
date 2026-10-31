import { describe, expect, it } from "vitest";

import { severityColor } from "./helpers";

describe("RPM Browse helpers", () => {
  it("colors advisory severity without red", () => {
    expect(severityColor("Critical")).toBe("orange");
    expect(severityColor(undefined)).toBe("grey");
  });
});
