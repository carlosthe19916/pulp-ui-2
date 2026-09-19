import { describe, expect, it } from "vitest";

import {
  valuesToNewRole,
  valuesToPatchedRole,
  type RoleFormValues,
} from "./useRoleForm";

const baseValues: RoleFormValues = {
  name: "my.role",
  description: "A role",
  permissions: ["core.view_task"],
};

describe("valuesToNewRole", () => {
  it("maps all fields for the create payload", () => {
    expect(valuesToNewRole(baseValues)).toEqual({
      name: "my.role",
      description: "A role",
      permissions: ["core.view_task"],
    });
  });

  it("coerces an empty description to undefined and defaults permissions", () => {
    const result = valuesToNewRole({
      ...baseValues,
      description: "",
      permissions: [],
    });
    expect(result.description).toBeUndefined();
    expect(result.permissions).toEqual([]);
    expect(result.name).toBe("my.role");
  });
});

describe("valuesToPatchedRole", () => {
  it("omits name from the edit payload", () => {
    const result = valuesToPatchedRole(baseValues);
    expect(result).not.toHaveProperty("name");
    expect(result).toEqual({
      description: "A role",
      permissions: ["core.view_task"],
    });
  });

  it("coerces an empty description to undefined", () => {
    const result = valuesToPatchedRole({ ...baseValues, description: "" });
    expect(result.description).toBeUndefined();
  });
});
