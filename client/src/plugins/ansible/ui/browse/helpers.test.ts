import { describe, expect, it } from "vitest";

import { fqcn } from "./helpers";

describe("Ansible browse helpers", () => {
  it("names a collection by its FQCN", () => {
    expect(fqcn({ namespace: "ansible", name: "posix" })).toBe("ansible.posix");
  });
});
