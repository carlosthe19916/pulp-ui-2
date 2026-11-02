import { beforeEach, describe, expect, it } from "vitest";

import {
  RECENT_TASKS_KEY,
  RECENT_TASKS_LIMIT,
  useRecentTasksStore,
} from "./useRecentTasksStore";

const href = (n: number) => `/api/pulp/default/api/v3/tasks/${n}/`;

describe("useRecentTasksStore", () => {
  beforeEach(() => {
    useRecentTasksStore.getState().reset();
  });

  it("keeps the newest task first", () => {
    const { record } = useRecentTasksStore.getState();
    record(href(1));
    record(href(2));
    expect(
      useRecentTasksStore.getState().tasks.map((task) => task.taskHref),
    ).toEqual([href(2), href(1)]);
  });

  it("moves a task recorded again to the front instead of repeating it", () => {
    const { record } = useRecentTasksStore.getState();
    record(href(1));
    record(href(2));
    record(href(1));
    expect(
      useRecentTasksStore.getState().tasks.map((task) => task.taskHref),
    ).toEqual([href(1), href(2)]);
  });

  it("keeps only the most recent tasks", () => {
    const { record } = useRecentTasksStore.getState();
    for (let n = 1; n <= RECENT_TASKS_LIMIT + 2; n++) record(href(n));
    const { tasks } = useRecentTasksStore.getState();
    expect(tasks).toHaveLength(RECENT_TASKS_LIMIT);
    expect(tasks[0]?.taskHref).toBe(href(RECENT_TASKS_LIMIT + 2));
  });

  it("persists only the tasks", () => {
    useRecentTasksStore.getState().record(href(1));
    const stored = JSON.parse(localStorage.getItem(RECENT_TASKS_KEY) ?? "{}");
    expect(Object.keys(stored.state)).toEqual(["tasks"]);
  });
});
