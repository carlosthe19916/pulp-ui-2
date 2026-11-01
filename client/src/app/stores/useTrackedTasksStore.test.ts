import { beforeEach, describe, expect, it } from "vitest";

import {
  TRACKED_TASKS_KEY,
  useTrackedTasksStore,
} from "./useTrackedTasksStore";

const change = {
  kind: "content-change" as const,
  taskHref: "/pulp/default/api/v3/tasks/1/",
  repositoryHref: "/pulp/default/api/v3/repositories/file/file/r1/",
  repositoryName: "r1",
};

const create = {
  kind: "create" as const,
  taskHref: "/pulp/default/api/v3/tasks/2/",
  entityType: "distribution" as const,
  domainName: "default",
  name: "d1",
};

const store = () => useTrackedTasksStore.getState();

describe("useTrackedTasksStore", () => {
  beforeEach(() => {
    store().reset();
    localStorage.removeItem(TRACKED_TASKS_KEY);
  });

  it("tracks a task once and untracks it by href", () => {
    store().track(change);
    store().track(change);
    store().track(create);
    expect(store().tasks.map((task) => task.taskHref)).toEqual([
      change.taskHref,
      create.taskHref,
    ]);

    store().untrack(change.taskHref);
    expect(store().tasks.map((task) => task.taskHref)).toEqual([
      create.taskHref,
    ]);
  });

  it("clears a repository's failure when a new change starts on it", () => {
    const failure = { taskHref: "/pulp/default/api/v3/tasks/0/", message: "x" };
    store().setFailure({ repositoryHref: change.repositoryHref, failure });
    expect(store().failures[change.repositoryHref]).toEqual(failure);

    store().track(change);
    expect(store().failures[change.repositoryHref]).toBeUndefined();
  });

  it("persists tasks but not failures", () => {
    store().track(create);
    store().setFailure({
      repositoryHref: change.repositoryHref,
      failure: { taskHref: change.taskHref },
    });

    const persisted = JSON.parse(
      localStorage.getItem(TRACKED_TASKS_KEY) ?? "{}",
    ) as { state: Record<string, unknown> };
    expect(Object.keys(persisted.state)).toEqual(["tasks"]);
  });

  it("drops tasks older than a day when rehydrating", async () => {
    const stale = { ...create, taskHref: "/stale/", startedAt: 0 };
    const fresh = { ...create, startedAt: Date.now() };
    localStorage.setItem(
      TRACKED_TASKS_KEY,
      JSON.stringify({ state: { tasks: [stale, fresh] }, version: 1 }),
    );

    await useTrackedTasksStore.persist.rehydrate();
    expect(store().tasks.map((task) => task.taskHref)).toEqual([
      create.taskHref,
    ]);
  });
});
