import { describe, expect, it } from "vitest";

import { valuesToNewGroup, type GroupFormValues } from "./useGroupForm";

describe("valuesToNewGroup", () => {
  it("maps the name field for the create payload", () => {
    const values: GroupFormValues = { name: "admins" };
    expect(valuesToNewGroup(values)).toEqual({ name: "admins" });
  });
});
