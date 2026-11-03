import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { TaskTracker } from "./TaskTracker";
import { type ITrackedTaskStatus, useTrackedTasks } from "./useTrackedTasks";

vi.mock(import("./useTrackedTasks"), () => ({ useTrackedTasks: vi.fn() }));

const task = (state?: string): ITrackedTaskStatus => ({
  taskHref: "/t/1/",
  title: "A",
  startedAt: 0,
  state,
  notFound: false,
  isUnreadable: false,
  createdResources: [],
  isActive: state === undefined || state === "running",
});

const setup = async (state?: string) => {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  vi.mocked(useTrackedTasks).mockReturnValue([task(state)]);
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <TaskTracker />
    </QueryClientProvider>,
  );
  const rerenderWith = (next?: string) => {
    vi.mocked(useTrackedTasks).mockReturnValue([task(next)]);
    return screen.rerender(
      <QueryClientProvider client={queryClient}>
        <TaskTracker />
      </QueryClientProvider>,
    );
  };
  return { invalidate, rerenderWith };
};

describe("TaskTracker", () => {
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
});
