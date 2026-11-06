import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { TaskFinishRefresher } from "./TaskFinishRefresher";
import { type ITrackedTaskStatus, useTrackedTasks } from "./useTrackedTasks";

vi.mock(import("./useTrackedTasks"), () => ({ useTrackedTasks: vi.fn() }));

const task = (state?: string, startedAt = 0): ITrackedTaskStatus => ({
  taskHref: "/t/1/",
  title: "A",
  startedAt,
  state,
  notFound: false,
  isUnreadable: false,
  createdResources: [],
  isActive: state === undefined || state === "running",
});

const setup = async (state?: string, startedAt = 0) => {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  vi.mocked(useTrackedTasks).mockReturnValue([task(state, startedAt)]);
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <TaskFinishRefresher />
    </QueryClientProvider>,
  );
  const rerenderWith = (next?: string) => {
    vi.mocked(useTrackedTasks).mockReturnValue([task(next, startedAt)]);
    return screen.rerender(
      <QueryClientProvider client={queryClient}>
        <TaskFinishRefresher />
      </QueryClientProvider>,
    );
  };
  return { invalidate, rerenderWith };
};

describe("TaskFinishRefresher", () => {
  it("refreshes the views when a task seen running finishes", async () => {
    const { invalidate, rerenderWith } = await setup("running");
    await rerenderWith("completed");
    expect(invalidate).toHaveBeenCalledOnce();
  });

  it("doesn't refresh when a task's first read says it already finished", async () => {
    const { invalidate, rerenderWith } = await setup(undefined);
    await rerenderWith("completed");
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("refreshes when a task started on this page finishes before its first read", async () => {
    const { invalidate, rerenderWith } = await setup(
      undefined,
      Date.now() + 1000,
    );
    await rerenderWith("completed");
    expect(invalidate).toHaveBeenCalledOnce();
  });
});
