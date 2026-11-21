import type React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { TaskResponse } from "@app/client";
import { useTasksListQuery } from "@app/queries/tasks";

import { TaskResults } from "./TaskResults";

vi.mock(import("@app/queries/tasks"), () => ({ useTasksListQuery: vi.fn() }));
vi.mock(import("@app/hooks/useSelectedDomain"), () => ({
  useSelectedDomain: () => ({ enabled: false, name: "default" }),
}));

const renderInRouter = (component: React.FC) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider
        router={createRouter({
          routeTree: createRootRoute({ component }),
          history: createMemoryHistory({ initialEntries: ["/"] }),
        })}
      />
    </QueryClientProvider>,
  );

const mockTasks = (
  results: (Partial<TaskResponse> & { error?: object })[],
  count = results.length,
) =>
  vi.mocked(useTasksListQuery).mockReturnValue({
    isLoading: false,
    data: { count, results },
  } as unknown as ReturnType<typeof useTasksListQuery>);

describe("TaskResults", () => {
  it("shows each failed task with its error and a link", async () => {
    mockTasks([
      {
        pulp_href: "/pulp/default/api/v3/tasks/0193-a/",
        name: "pulp_python.app.tasks.sync.sync",
        state: "failed",
        error: { description: "Cannot connect to host pypi.org:443" },
      },
    ]);
    const screen = await renderInRouter(() => (
      <TaskResults state="failed" name="sync" />
    ));

    await expect
      .element(
        screen.getByRole("heading", { name: '1 failed task matching "sync"' }),
      )
      .toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "sync" }))
      .toBeVisible();
    await expect
      .element(screen.getByText("Cannot connect to host pypi.org:443"))
      .toBeVisible();
    expect(vi.mocked(useTasksListQuery)).toHaveBeenCalledWith({
      params: expect.objectContaining({
        state: "failed",
        name__contains: "sync",
      }),
    });
  });

  it("says what holds a waiting task", async () => {
    mockTasks([
      {
        pulp_href: "/pulp/default/api/v3/tasks/0193-b/",
        name: "pulp_file.app.tasks.synchronizing.synchronize",
        state: "waiting",
      },
    ]);
    const screen = await renderInRouter(() => <TaskResults state="waiting" />);

    await expect
      .element(
        screen.getByText("Blocked by an earlier task on the same resources"),
      )
      .toBeVisible();
  });

  it("says when there are none", async () => {
    mockTasks([]);
    const screen = await renderInRouter(() => <TaskResults state="running" />);

    await expect
      .element(screen.getByRole("heading", { name: "No running tasks" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "View running tasks" }))
      .toBeVisible();
  });
});
