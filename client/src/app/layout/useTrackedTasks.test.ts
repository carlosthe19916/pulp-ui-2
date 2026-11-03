import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { type ITaskStateProbe, useTaskDetailQueries } from "@app/queries/tasks";
import { useTrackedTasksStore } from "@app/stores/useTrackedTasksStore";

import { useTrackedTasks } from "./useTrackedTasks";

vi.mock(import("@app/queries/tasks"), () => ({
  useTaskDetailQueries: vi.fn(),
  isTerminalTaskState: (state?: string | null) =>
    ["completed", "failed", "canceled", "skipped"].includes(state ?? ""),
}));

const probe = (fields: Partial<ITaskStateProbe>): ITaskStateProbe => ({
  notFound: false,
  isReadError: false,
  createdResources: [],
  ...fields,
});

describe("useTrackedTasks", () => {
  beforeEach(() => {
    useTrackedTasksStore.getState().reset();
    for (const href of [
      "/t/done/",
      "/t/run/",
      "/t/gone/",
      "/t/err/",
      "/t/new/",
    ]) {
      useTrackedTasksStore.getState().track({ taskHref: href, title: href });
    }
    vi.mocked(useTaskDetailQueries).mockReturnValue(
      new Map([
        ["/t/done/", probe({ state: "completed" })],
        ["/t/run/", probe({ state: "running" })],
        ["/t/gone/", probe({ notFound: true })],
        ["/t/err/", probe({ isReadError: true })],
        ["/t/new/", probe({})],
      ]),
    );
  });

  it("counts running and not-yet-read tasks as active, and nothing else", async () => {
    const { result } = await renderHook(() => useTrackedTasks());
    const active = Object.fromEntries(
      result.current.map((task) => [task.taskHref, task.isActive]),
    );
    expect(active).toEqual({
      "/t/done/": false,
      "/t/run/": true,
      "/t/gone/": false,
      "/t/err/": false,
      "/t/new/": true,
    });
  });

  it("marks a task whose state can't be read", async () => {
    const { result } = await renderHook(() => useTrackedTasks());
    expect(
      result.current.find((task) => task.taskHref === "/t/err/")?.isUnreadable,
    ).toBe(true);
  });
});
