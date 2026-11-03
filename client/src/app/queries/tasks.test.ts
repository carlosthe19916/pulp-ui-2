import type { AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { buildTaskHref, taskPollDelay, toWriteResult } from "./tasks";

const taskHref = "/pulp/default/api/v3/tasks/1/";

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

describe("toWriteResult", () => {
  it("returns the object a 200 answers with, even if it has a task field", () => {
    const object = { name: "foo", task: "not-a-task-href" };
    expect(
      toWriteResult({ status: 200, data: object } as AxiosResponse<
        typeof object
      >),
    ).toEqual({ kind: "object", object });
  });

  it("returns the task a 202 answers with", () => {
    expect(
      toWriteResult({
        status: 202,
        data: { task: taskHref },
      } as AxiosResponse<{ task: string }>),
    ).toEqual({ kind: "task", taskHref });
  });
});
