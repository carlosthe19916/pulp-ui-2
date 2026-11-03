import type React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { useTaskTracker } from "@app/hooks/useTaskTracker";
import { useTaskDetailQueries } from "@app/queries/tasks";

import { clearTrackedTasks, TRACKED_TASKS_KEY } from "./TaskTrackerContext";
import { TaskTrackerProvider } from "./TaskTrackerProvider";

vi.mock(import("@app/queries/tasks"), () => ({
  useTaskDetailQueries: vi.fn(),
  isTerminalTaskState: (state?: string | null) =>
    ["completed", "failed", "canceled", "skipped"].includes(state ?? ""),
}));

const stateByHref = (states: Record<string, string>) =>
  vi
    .mocked(useTaskDetailQueries)
    .mockImplementation(
      ({ taskHrefs }) =>
        new Map(
          taskHrefs.map((href) => [
            href,
            { state: states[href], notFound: false, createdResources: [] },
          ]),
        ),
    );

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <TaskTrackerProvider>{children}</TaskTrackerProvider>
  </QueryClientProvider>
);

const hrefs = (tasks: { taskHref: string }[]) =>
  tasks.map((task) => task.taskHref);

describe("TaskTrackerProvider", () => {
  beforeEach(() => {
    localStorage.removeItem(TRACKED_TASKS_KEY);
    stateByHref({});
  });

  it("lists started tasks newest first, once each", async () => {
    const { result, act } = await renderHook(() => useTaskTracker(), {
      wrapper,
    });

    await act(() =>
      result.current.trackTask({ taskHref: "/t/1/", title: "A" }),
    );
    await act(() =>
      result.current.trackTask({ taskHref: "/t/2/", title: "B" }),
    );
    await act(() =>
      result.current.trackTask({ taskHref: "/t/1/", title: "A" }),
    );

    expect(hrefs(result.current.tasks)).toEqual(["/t/1/", "/t/2/"]);
    expect(localStorage.getItem(TRACKED_TASKS_KEY)).toContain("/t/2/");
  });

  it("clears finished tasks and keeps running ones", async () => {
    stateByHref({ "/t/1/": "completed", "/t/2/": "running" });
    const { result, act } = await renderHook(() => useTaskTracker(), {
      wrapper,
    });
    await act(() =>
      result.current.trackTask({ taskHref: "/t/1/", title: "A" }),
    );
    await act(() =>
      result.current.trackTask({ taskHref: "/t/2/", title: "B" }),
    );

    expect(result.current.tasks.map((task) => task.isActive)).toEqual([
      true,
      false,
    ]);
    await act(() => result.current.clearFinished());
    expect(hrefs(result.current.tasks)).toEqual(["/t/2/"]);
  });

  it("drops tasks older than a day", async () => {
    localStorage.setItem(
      TRACKED_TASKS_KEY,
      JSON.stringify([
        { taskHref: "/t/new/", title: "New", startedAt: Date.now() },
        { taskHref: "/t/old/", title: "Old", startedAt: 0 },
      ]),
    );
    const { result } = await renderHook(() => useTaskTracker(), { wrapper });

    expect(hrefs(result.current.tasks)).toEqual(["/t/new/"]);
  });

  it("forgets every task on logout", async () => {
    const { result, act } = await renderHook(() => useTaskTracker(), {
      wrapper,
    });
    await act(() =>
      result.current.trackTask({ taskHref: "/t/1/", title: "A" }),
    );

    await act(() => clearTrackedTasks());
    expect(result.current.tasks).toEqual([]);
  });
});
