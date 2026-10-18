import { AxiosError, AxiosHeaders } from "axios";

import type { TaskResponse } from "@app/client";

import {
  getMutationErrorMessage,
  getTaskErrorMessage,
  getToolbarChipKey,
} from "./utils";

describe("utils", () => {
  it("getToolbarChipKey: test 'string'", () => {
    const result = getToolbarChipKey("myValue");
    expect(result).toBe("myValue");
  });

  it("getToolbarChipKey: test 'ToolbarChip'", () => {
    const result = getToolbarChipKey({ key: "myKey", node: "myNode" });
    expect(result).toBe("myKey");
  });

  const makeAxiosError = (status: number, data?: unknown): AxiosError => {
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
  };

  it("getMutationErrorMessage: returns fallback only for a plain non-Error value", () => {
    expect(
      getMutationErrorMessage({
        error: "boom",
        fallback: "Failed to create thing",
      }),
    ).toEqual({
      title: "Failed to create thing",
    });
  });

  it("getMutationErrorMessage: surfaces message from a generic Error", () => {
    expect(
      getMutationErrorMessage({
        error: new Error("network down"),
        fallback: "Failed to save",
      }),
    ).toEqual({
      title: "Failed to save",
      description: "network down",
    });
  });

  it("getMutationErrorMessage: surfaces a permission message on 403", () => {
    const error = makeAxiosError(403);
    expect(
      getMutationErrorMessage({ error, fallback: "Failed to delete role" }),
    ).toEqual({
      title: "Failed to delete role",
      description:
        "You do not have permission to perform this action. Ask an administrator to grant the required role.",
    });
  });

  it("getMutationErrorMessage: surfaces validation detail from response data", () => {
    const error = makeAxiosError(400, { detail: "name already exists" });
    expect(
      getMutationErrorMessage({ error, fallback: "Failed to create group" }),
    ).toEqual({
      title: "Failed to create group",
      description: "name already exists",
    });
  });

  it("getMutationErrorMessage: surfaces joined non_field_errors", () => {
    const error = makeAxiosError(400, {
      non_field_errors: ["This field is required.", "Invalid value."],
    });
    expect(
      getMutationErrorMessage({ error, fallback: "Failed to create user" }),
    ).toEqual({
      title: "Failed to create user",
      description: "This field is required. Invalid value.",
    });
  });

  it("getMutationErrorMessage: surfaces a single DRF field error", () => {
    const error = makeAxiosError(400, {
      name: ["This field is required."],
    });
    expect(
      getMutationErrorMessage({
        error,
        fallback: "Failed to create repository",
      }),
    ).toEqual({
      title: "Failed to create repository",
      description: "Name: This field is required.",
    });
  });

  it("getMutationErrorMessage: joins multiple DRF field errors", () => {
    const error = makeAxiosError(400, {
      name: ["Required."],
      url: ["Enter a valid URL."],
    });
    expect(
      getMutationErrorMessage({ error, fallback: "Failed to create remote" }),
    ).toEqual({
      title: "Failed to create remote",
      description: "Name: Required.; Url: Enter a valid URL.",
    });
  });

  it("getMutationErrorMessage: recurses into nested field dicts", () => {
    const error = makeAxiosError(400, {
      config: { proxy_url: ["Enter a valid URL."] },
    });
    expect(
      getMutationErrorMessage({ error, fallback: "Failed to save" })
        .description,
    ).toBe("Config: Proxy url: Enter a valid URL.");
  });

  it("getMutationErrorMessage: handles a bare-array 400 body", () => {
    const error = makeAxiosError(400, ["URI not valid: /bad/uri"]);
    expect(
      getMutationErrorMessage({ error, fallback: "Failed" }).description,
    ).toBe("URI not valid: /bad/uri");
  });

  it("getMutationErrorMessage: handles a list-serializer array body", () => {
    const error = makeAxiosError(400, [
      {},
      { name: ["This field is required."] },
    ]);
    expect(
      getMutationErrorMessage({ error, fallback: "Failed" }).description,
    ).toBe("Name: This field is required.");
  });

  it("getMutationErrorMessage: reads a container errors[] envelope", () => {
    const error = makeAxiosError(401, {
      errors: [{ code: "UNAUTHORIZED", message: "authentication required" }],
    });
    expect(
      getMutationErrorMessage({ error, fallback: "Failed" }).description,
    ).toBe("authentication required");
  });

  it("getMutationErrorMessage: reads a Galaxy v3 errors[] envelope", () => {
    const error = makeAxiosError(404, {
      errors: [{ status: "404", code: "not_found", title: "Not found." }],
    });
    expect(
      getMutationErrorMessage({ error, fallback: "Failed" }).description,
    ).toBe("Not found.");
  });

  it("getMutationErrorMessage: reads a plugin { error } body", () => {
    const error = makeAxiosError(400, { error: "Service unavailable" });
    expect(
      getMutationErrorMessage({ error, fallback: "Failed" }).description,
    ).toBe("Service unavailable");
  });

  it("getMutationErrorMessage: combines a plugin { error, detail } body", () => {
    const error = makeAxiosError(409, {
      error: "Migration failed",
      detail: "domain is busy",
    });
    expect(
      getMutationErrorMessage({ error, fallback: "Failed" }).description,
    ).toBe("Migration failed — domain is busy");
  });

  it("getMutationErrorMessage: surfaces a plain-text (non-JSON) body", () => {
    const error = makeAxiosError(502, "Proxy error: upstream down");
    expect(
      getMutationErrorMessage({ error, fallback: "Failed" }).description,
    ).toBe("Proxy error: upstream down");
  });

  it("getMutationErrorMessage: falls back to the axios message on a network error", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");
    expect(
      getMutationErrorMessage({ error, fallback: "Failed to save" }),
    ).toEqual({
      title: "Failed to save",
      description: "Network Error",
    });
  });

  it("getMutationErrorMessage: falls back to title-only when no useful detail exists", () => {
    const error = makeAxiosError(500, {});
    const result = getMutationErrorMessage({
      error,
      fallback: "Failed to create remote",
    });
    expect(result.title).toBe("Failed to create remote");
  });

  it("getMutationErrorMessage: appends the server detail to a 403 message", () => {
    const error = makeAxiosError(403, { detail: "repository is read-only" });
    const result = getMutationErrorMessage({ error, fallback: "Failed" });
    expect(result.description).toContain("repository is read-only");
    expect(result.description).toContain("You do not have permission");
  });

  it("getMutationErrorMessage: keeps DRF field errors when a field is named 'error'", () => {
    const error = makeAxiosError(400, {
      error: ["This field is required."],
      name: ["Required."],
    });
    const result = getMutationErrorMessage({ error, fallback: "Failed" });
    expect(result.description).toContain("Name: Required.");
  });

  const makeTask = (task: Partial<TaskResponse> & Record<string, unknown>) =>
    task as TaskResponse;

  it("getTaskErrorMessage: prefers the error description", () => {
    expect(
      getTaskErrorMessage(
        makeTask({ state: "failed", error: { description: "boom" } }),
      ),
    ).toBe("boom");
  });

  it("getTaskErrorMessage: falls back to the cancellation reason", () => {
    expect(
      getTaskErrorMessage(
        makeTask({ state: "canceled", error: { reason: "user canceled" } }),
      ),
    ).toBe("user canceled");
  });

  it("getTaskErrorMessage: falls back to a string result when there is no error", () => {
    expect(
      getTaskErrorMessage(
        makeTask({ state: "failed", result: "legacy error" }),
      ),
    ).toBe("legacy error");
  });

  it("getTaskErrorMessage: returns undefined for a task with no failure detail", () => {
    expect(
      getTaskErrorMessage(makeTask({ state: "completed" })),
    ).toBeUndefined();
    expect(getTaskErrorMessage(undefined)).toBeUndefined();
  });
});
