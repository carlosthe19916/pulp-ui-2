import { describe, expect, it } from "vitest";

import {
  valuesToNewUser,
  valuesToPatchedUser,
  type UserFormValues,
} from "./useUserForm";

const baseValues: UserFormValues = {
  username: "alice",
  password: "supersecret",
  email: "alice@example.com",
  first_name: "Alice",
  last_name: "Doe",
  is_active: true,
  is_staff: false,
};

describe("valuesToNewUser", () => {
  it("maps all fields for the create payload", () => {
    expect(valuesToNewUser(baseValues)).toEqual({
      username: "alice",
      password: "supersecret",
      email: "alice@example.com",
      first_name: "Alice",
      last_name: "Doe",
      is_active: true,
      is_staff: false,
    });
  });

  it("coerces empty optional strings to undefined", () => {
    const result = valuesToNewUser({
      ...baseValues,
      email: "",
      first_name: "",
      last_name: "",
    });
    expect(result.email).toBeUndefined();
    expect(result.first_name).toBeUndefined();
    expect(result.last_name).toBeUndefined();
    // Required fields are preserved even though optionals are dropped.
    expect(result.username).toBe("alice");
    expect(result.password).toBe("supersecret");
  });
});

describe("valuesToPatchedUser", () => {
  it("omits username and password from the edit payload", () => {
    const result = valuesToPatchedUser(baseValues);
    expect(result).not.toHaveProperty("username");
    expect(result).not.toHaveProperty("password");
    expect(result).toEqual({
      email: "alice@example.com",
      first_name: "Alice",
      last_name: "Doe",
      is_active: true,
      is_staff: false,
    });
  });

  it("coerces empty optional strings to undefined", () => {
    const result = valuesToPatchedUser({
      ...baseValues,
      email: "",
      first_name: "",
      last_name: "",
    });
    expect(result.email).toBeUndefined();
    expect(result.first_name).toBeUndefined();
    expect(result.last_name).toBeUndefined();
  });
});
