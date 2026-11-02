import { beforeEach, describe, expect, it } from "vitest";

import { useRecentTasksStore } from "@app/stores/useRecentTasksStore";

import { recordTask } from "./recordTask";

describe("recordTask", () => {
  beforeEach(() => useRecentTasksStore.getState().reset());

  it("records the task in recent tasks and returns the response", () => {
    const response = { task: "/pulp/default/api/v3/tasks/1/" };
    expect(recordTask(response)).toBe(response);
    expect(useRecentTasksStore.getState().tasks[0]?.taskHref).toBe(
      response.task,
    );
  });
});
