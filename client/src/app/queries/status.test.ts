import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";

import type * as ApiInit from "@app/axios-config/apiInit";
import { axiosInstance } from "@app/axios-config/apiInit";
import type { StatusResponse } from "@app/client";

import { statusQueryOptions } from "./status";

vi.mock(import("@app/axios-config/apiInit"), () => {
  const axiosInstance = { get: vi.fn() };
  return {
    axiosInstance,
    initInterceptors: vi.fn(),
  } as unknown as typeof ApiInit;
});

const runQueryFn = () =>
  (statusQueryOptions.queryFn as unknown as () => Promise<StatusResponse>)();

describe("statusQueryOptions", () => {
  // A wrong PULP_API_URL / PULP_API_ROOT makes the proxy return an HTML page with
  // 200 OK; the query must raise an AxiosError naming the config so the app's
  // status gate surfaces it instead of rendering against garbage.
  it("rejects with an AxiosError naming the config when the status is not JSON", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: "<!DOCTYPE html>...",
      headers: { "content-type": "text/html; charset=utf-8" },
      config: {},
      request: {},
    } as never);

    await expect(runQueryFn()).rejects.toThrow("PULP_API_ROOT");
    await expect(runQueryFn()).rejects.toBeInstanceOf(AxiosError);
  });

  it("returns the status payload when the response is JSON", async () => {
    const status = { versions: [] } as unknown as StatusResponse;
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: status,
      headers: { "content-type": "application/json" },
    } as never);

    await expect(runQueryFn()).resolves.toBe(status);
  });
});
