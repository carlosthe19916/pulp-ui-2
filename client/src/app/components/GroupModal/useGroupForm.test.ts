import { describe, expect, it } from "vitest";

import {
  valuesToNewGroup,
  valuesToPatchedGroup,
  type GroupFormValues,
} from "./useGroupForm";

describe("valuesToNewGroup", () => {
  it("maps the name field for the create payload", () => {
    const values: GroupFormValues = { name: "admins" };
    expect(valuesToNewGroup(values)).toEqual({ name: "admins" });
  });
});

describe("valuesToPatchedGroup", () => {
  it("maps the name field for the edit payload", () => {
    const values: GroupFormValues = { name: "editors" };
    expect(valuesToPatchedGroup(values)).toEqual({ name: "editors" });
  });
});
