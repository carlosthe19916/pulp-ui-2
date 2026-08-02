import { AxiosError, AxiosHeaders } from "axios";

import { getMutationErrorMessage, getToolbarChipKey } from "./utils";

describe("utils", () => {
  // getToolbarChipKey

  it("getToolbarChipKey: test 'string'", () => {
    const result = getToolbarChipKey("myValue");
    expect(result).toBe("myValue");
  });

  it("getToolbarChipKey: test 'ToolbarChip'", () => {
    const result = getToolbarChipKey({ key: "myKey", node: "myNode" });
    expect(result).toBe("myKey");
  });

  // getMutationErrorMessage

  function makeAxiosError(status: number, data?: unknown): AxiosError {
    return new AxiosError(
      "Request failed",
      String(status),
      undefined,
      undefined,
      {
        status,
        statusText: String(status),
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data,
      },
    );
  }

  it("getMutationErrorMessage: returns fallback only for a plain non-Error value", () => {
    expect(getMutationErrorMessage("boom", "Failed to create thing")).toEqual({
      title: "Failed to create thing",
    });
  });

  it("getMutationErrorMessage: surfaces message from a generic Error", () => {
    expect(
      getMutationErrorMessage(new Error("network down"), "Failed to save"),
    ).toEqual({
      title: "Failed to save",
      description: "network down",
    });
  });

  it("getMutationErrorMessage: surfaces a permission message on 403", () => {
    const error = makeAxiosError(403);
    expect(getMutationErrorMessage(error, "Failed to delete role")).toEqual({
      title: "Failed to delete role",
      description:
        "You do not have permission to perform this action. Ask an administrator to grant the required role.",
    });
  });

  it("getMutationErrorMessage: surfaces validation detail from response data", () => {
    const error = makeAxiosError(400, { detail: "name already exists" });
    expect(getMutationErrorMessage(error, "Failed to create group")).toEqual({
      title: "Failed to create group",
      description: "name already exists",
    });
  });

  it("getMutationErrorMessage: surfaces joined non_field_errors", () => {
    const error = makeAxiosError(400, {
      non_field_errors: ["This field is required.", "Invalid value."],
    });
    expect(getMutationErrorMessage(error, "Failed to create user")).toEqual({
      title: "Failed to create user",
      description: "This field is required. Invalid value.",
    });
  });

  it("getMutationErrorMessage: falls back to title-only when no useful detail exists", () => {
    const error = makeAxiosError(500, {});
    const result = getMutationErrorMessage(error, "Failed to create remote");
    expect(result.title).toBe("Failed to create remote");
  });
});
