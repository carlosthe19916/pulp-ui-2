import { describe, expect, it } from "vitest";

import {
  type IGroupFormValues,
  valuesToNewGroup,
  valuesToPatchedGroup,
} from "./useGroupForm";

describe("valuesToNewGroup", () => {
  it("maps the name field for the create payload", () => {
    const values: IGroupFormValues = { name: "admins" };
    expect(valuesToNewGroup(values)).toEqual({ name: "admins" });
  });
});

describe("valuesToPatchedGroup", () => {
  it("maps the name field for the edit payload", () => {
    const values: IGroupFormValues = { name: "editors" };
    expect(valuesToPatchedGroup(values)).toEqual({ name: "editors" });
  });
});
