import type { AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import type * as ApiInit from "@app/axios-config/apiInit";
import { axiosInstance } from "@app/axios-config/apiInit";

import {
  buildTaskHref,
  SETTLE_TIMEOUT_MS,
  settleTask,
  settleWrite,
  taskPollDelay,
} from "./tasks";

vi.mock(import("@app/axios-config/apiInit"), () => {
  const axiosInstance = { get: vi.fn() };
  return {
    axiosInstance,
    initInterceptors: vi.fn(),
  } as unknown as typeof ApiInit;
});

const taskHref = "/pulp/default/api/v3/tasks/1/";
const reads = (...states: string[]) =>
  states.forEach((state) =>
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: { state, name: "x", logging_cid: "" },
    }),
  );

describe("buildTaskHref", () => {
  it("builds a domain-scoped task href when domains are enabled", () => {
    expect(buildTaskHref("abc-123", { enabled: true, name: "myd" })).toBe(
      "/pulp/myd/api/v3/tasks/abc-123/",
    );
  });

  it("omits the domain segment when domains are disabled", () => {
    expect(buildTaskHref("abc-123", { enabled: false, name: "default" })).toBe(
      "/pulp/api/v3/tasks/abc-123/",
    );
  });
});

describe("taskPollDelay", () => {
  it("backs off by a second per check, up to the poll interval", () => {
    expect([1, 2, 3, 4, 5, 6, 20].map(taskPollDelay)).toEqual([
      1000, 2000, 3000, 4000, 5000, 5000, 5000,
    ]);
  });
});

describe("settleTask", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(axiosInstance.get).mockReset();
  });

  it("returns the finished task once it completes", async () => {
    reads("waiting", "running", "completed");
    const settled = await settleTask({ task: taskHref });
    expect(settled.taskHref).toBe(taskHref);
    expect(settled.finished?.state).toBe("completed");
  });

  it("rejects with the task's error when it fails", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: {
        state: "failed",
        name: "x",
        logging_cid: "",
        error: { description: "Remote is in use" },
      },
    });
    await expect(settleTask({ task: taskHref })).rejects.toThrow(
      "Remote is in use",
    );
  });

  it("hands back a task still running when the wait ends", async () => {
    vi.useFakeTimers();
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { state: "running", name: "x", logging_cid: "" },
    });
    const settled = settleTask({ task: taskHref });
    await vi.advanceTimersByTimeAsync(SETTLE_TIMEOUT_MS);
    await expect(settled).resolves.toEqual({ kind: "task", taskHref });
  });
});

describe("settleWrite", () => {
  afterEach(() => vi.mocked(axiosInstance.get).mockReset());

  it("returns the object a 200 answers with, without reading any task", async () => {
    const object = { name: "foo", task: "not-a-task-href" };
    await expect(
      settleWrite({ status: 200, data: object } as AxiosResponse<
        typeof object
      >),
    ).resolves.toEqual({ kind: "object", object });
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  it("waits for the task a 202 answers with", async () => {
    reads("completed");
    const settled = await settleWrite({
      status: 202,
      data: { task: taskHref },
    } as AxiosResponse<{ task: string }>);
    expect(settled).toMatchObject({ kind: "task", taskHref });
  });
});
