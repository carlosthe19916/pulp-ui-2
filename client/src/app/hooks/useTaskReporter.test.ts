import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { useNotifications } from "@app/hooks/useNotifications";
import { useTrackedTasksStore } from "@app/stores/useTrackedTasksStore";

import { useTaskReporter } from "./useTaskReporter";

vi.mock(import("@app/hooks/useNotifications"), () => ({
  useNotifications: vi.fn(),
}));

const addNotification = vi.fn();
const taskHref = "/pulp/default/api/v3/tasks/1/";
const tracked = () =>
  useTrackedTasksStore.getState().tasks.map((task) => task.taskHref);

describe("useTaskReporter", () => {
  beforeEach(() => {
    addNotification.mockReset();
    vi.mocked(useNotifications).mockReturnValue({ addNotification });
    useTrackedTasksStore.getState().reset();
  });

  it("confirms an update that returned the object", async () => {
    const { result } = await renderHook(() => useTaskReporter());
    result.current.reportWrite({
      result: { kind: "object", object: { name: "foo" } },
      finishedTitle: "Remote updated",
      startedTitle: "Remote update started",
    });
    expect(addNotification).toHaveBeenCalledWith({
      title: "Remote updated",
      variant: "success",
    });
  });

  it("reports the task an update started, and tracks it", async () => {
    const { result } = await renderHook(() => useTaskReporter());
    result.current.reportWrite({
      result: { kind: "task", taskHref },
      finishedTitle: "Remote deleted",
      startedTitle: "Remote deletion started",
    });
    expect(addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Remote deletion started",
        variant: "info",
      }),
    );
    expect(tracked()).toEqual([taskHref]);
  });
});
