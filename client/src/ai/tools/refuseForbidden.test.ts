import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { refuseForbidden } from "./refuseForbidden";

const httpError = (status: number) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  });

describe("refuseForbidden", () => {
  it("returns what the read returns", async () => {
    await expect(
      refuseForbidden({
        action: "list tasks",
        read: async () => ({ count: 2 }),
      }),
    ).resolves.toEqual({ count: 2 });
  });

  it("turns a 403 into a refusal", async () => {
    await expect(
      refuseForbidden({
        action: "list tasks",
        read: () => Promise.reject(httpError(403)),
      }),
    ).resolves.toEqual({ error: "The user isn't allowed to list tasks." });
  });

  it("rethrows any other error", async () => {
    const error = httpError(500);
    await expect(
      refuseForbidden({
        action: "list tasks",
        read: () => Promise.reject(error),
      }),
    ).rejects.toBe(error);
  });
});
