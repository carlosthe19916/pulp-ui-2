import type React from "react";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { tasksListQueryOptions } from "@app/queries/tasks";

import { useTaskListTool } from "./useTaskListTool";

vi.mock(import("@copilotkit/react-core/v2"), async (importOriginal) => ({
  ...(await importOriginal()),
  useFrontendTool: vi.fn(),
}));
vi.mock(import("@app/queries/tasks"), async (importOriginal) => ({
  ...(await importOriginal()),
  tasksListQueryOptions: vi.fn(),
}));
vi.mock(import("@app/hooks/useSelectedDomain"), () => ({
  useSelectedDomain: () => ({ enabled: false, name: "default" }),
}));

const runHandler = async (args: object) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  await renderHook(() => useTaskListTool(), { wrapper });
  const tool = vi.mocked(useFrontendTool).mock.lastCall?.[0];
  return tool?.handler?.(args as never, {} as never);
};

const answerTasks = (results: object[]) =>
  vi.mocked(tasksListQueryOptions).mockReturnValue({
    queryKey: ["tasks", results],
    queryFn: () => Promise.resolve({ count: results.length, results }),
  } as unknown as ReturnType<typeof tasksListQueryOptions>);

describe("showTasks", () => {
  it("gives failed tasks their error, cut short", async () => {
    answerTasks([
      {
        name: "pulp_python.app.tasks.sync.sync",
        finished_at: "2026-11-21T10:00:00Z",
        error: { description: "x".repeat(2000) },
        reserved_resources_record: ["prn:python.pythonrepository:0193-r"],
      },
    ]);
    const summary = (await runHandler({ state: "failed" })) as {
      shown: Record<string, unknown>[];
    };

    expect(summary.shown[0]).toMatchObject({
      finished: "2026-11-21T10:00:00Z",
    });
    expect(summary.shown[0]?.error).toHaveLength(500);
    expect(summary.shown[0]).not.toHaveProperty("resources");
  });

  it("gives waiting tasks what holds them and their resources", async () => {
    answerTasks([
      {
        name: "pulp_file.app.tasks.synchronizing.synchronize",
        reserved_resources_record: ["prn:file.filerepository:0193-r"],
      },
    ]);
    const summary = await runHandler({ state: "waiting" });

    expect(summary).toEqual({
      count: 1,
      shown: [
        expect.objectContaining({
          waiting: "Blocked by an earlier task on the same resources",
          resources: ["prn:file.filerepository:0193-r"],
        }),
      ],
    });
  });
});
