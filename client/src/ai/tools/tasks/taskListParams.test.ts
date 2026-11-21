import { describe, expect, it } from "vitest";

import type { TaskResponse } from "@app/client";

import {
  currentProgress,
  taskListParams,
  waitingReason,
} from "./taskListParams";

const task = (fields: Partial<TaskResponse>): TaskResponse => ({
  name: "pulp_rpm.app.tasks.synchronizing.synchronize",
  logging_cid: "cid",
  ...fields,
});

describe("taskListParams", () => {
  it("orders failed tasks by when they finished, others by when they were created", () => {
    expect(taskListParams({ state: "failed" }).ordering).toBe("-finished_at");
    expect(taskListParams({ state: "waiting" }).ordering).toBe("-pulp_created");
  });

  it("filters by name only when one is given", () => {
    expect(taskListParams({ state: "failed", name: "sync" })).toMatchObject({
      name__contains: "sync",
    });
    expect(taskListParams({ state: "failed", name: "" }).name__contains).toBe(
      undefined,
    );
  });
});

describe("waitingReason", () => {
  it("tells a blocked task from one waiting for a worker", () => {
    expect(waitingReason(task({}))).toBe(
      "Blocked by an earlier task on the same resources",
    );
    expect(waitingReason(task({ unblocked_at: "2026-11-21T10:00:00Z" }))).toBe(
      "Waiting for a free worker",
    );
  });
});

describe("currentProgress", () => {
  it("prefers the running report", () => {
    expect(
      currentProgress(
        task({
          progress_reports: [
            {
              message: "Downloading Metadata Files",
              state: "completed",
              done: 6,
            },
            {
              message: "Downloading Artifacts",
              state: "running",
              done: 40,
              total: 120,
            },
            { message: "Associating Content", state: "waiting", done: 0 },
          ],
        }),
      ),
    ).toBe("Downloading Artifacts: 40 of 120");
  });

  it("falls back to the last report, and to nothing without one", () => {
    expect(
      currentProgress(
        task({
          progress_reports: [
            { message: "Parsed Packages", state: "completed", done: 12 },
          ],
        }),
      ),
    ).toBe("Parsed Packages: 12");
    expect(currentProgress(task({}))).toBe(undefined);
  });
});
