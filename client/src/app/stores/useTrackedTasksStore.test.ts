import { beforeEach, describe, expect, it } from "vitest";

import {
  TRACKED_TASKS_KEY,
  useTrackedTasksStore,
} from "./useTrackedTasksStore";

const store = () => useTrackedTasksStore.getState();
const hrefs = () => store().tasks.map((task) => task.taskHref);

describe("useTrackedTasksStore", () => {
  beforeEach(() => {
    store().reset();
    localStorage.removeItem(TRACKED_TASKS_KEY);
  });

  it("lists started tasks newest first, once each", () => {
    store().track({ taskHref: "/t/1/", title: "A" });
    store().track({ taskHref: "/t/2/", title: "B" });
    store().track({ taskHref: "/t/1/", title: "A" });
    expect(hrefs()).toEqual(["/t/1/", "/t/2/"]);
  });

  it("untracks the given tasks", () => {
    store().track({ taskHref: "/t/1/", title: "A" });
    store().track({ taskHref: "/t/2/", title: "B" });
    store().untrack(["/t/1/"]);
    expect(hrefs()).toEqual(["/t/2/"]);
  });

  it("persists only the tasks", () => {
    store().track({ taskHref: "/t/1/", title: "A" });
    const persisted = JSON.parse(
      localStorage.getItem(TRACKED_TASKS_KEY) ?? "{}",
    ) as { state: Record<string, unknown> };
    expect(Object.keys(persisted.state)).toEqual(["tasks"]);
  });

  it("drops tasks older than a day when rehydrating", async () => {
    localStorage.setItem(
      TRACKED_TASKS_KEY,
      JSON.stringify({
        state: {
          tasks: [
            { taskHref: "/t/new/", title: "New", startedAt: Date.now() },
            { taskHref: "/t/old/", title: "Old", startedAt: 0 },
          ],
        },
        version: 2,
      }),
    );
    await useTrackedTasksStore.persist.rehydrate();
    expect(hrefs()).toEqual(["/t/new/"]);
  });

  it("drops entries saved in the previous shape", async () => {
    localStorage.setItem(
      TRACKED_TASKS_KEY,
      JSON.stringify({
        state: { tasks: [{ kind: "create", taskHref: "/t/1/", startedAt: 1 }] },
        version: 1,
      }),
    );
    await useTrackedTasksStore.persist.rehydrate();
    expect(hrefs()).toEqual([]);
  });
});
