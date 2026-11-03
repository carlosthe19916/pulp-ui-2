import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** A task this browser started, as recorded when it started. */
export interface ITrackedTask {
  taskHref: string;
  /** The started toast's title, e.g. `Sync of "my-repo" started`. */
  title: string;
  startedAt: number;
}

interface ITrackedTasksState {
  /** Newest first. */
  tasks: ITrackedTask[];
  track: (task: Omit<ITrackedTask, "startedAt">) => void;
  untrack: (taskHrefs: string[]) => void;
  reset: () => void;
}

export const TRACKED_TASKS_KEY = "pulp-ui/tracked-tasks";
/** Tasks older than a day are dropped on load, so the list can't grow without bound. */
const TRACKED_TASK_TTL_MS = 24 * 60 * 60 * 1000;

const isFresh = (task: ITrackedTask) =>
  Date.now() - task.startedAt < TRACKED_TASK_TTL_MS;

/**
 * The tasks this browser started (the Tasks API can't filter by creator), kept across
 * reloads; the task drawer reads each one's state from Pulp.
 */
export const useTrackedTasksStore = create<ITrackedTasksState>()(
  persist(
    (set) => ({
      tasks: [],
      track: (task) =>
        set((state) => ({
          tasks: [
            { ...task, startedAt: Date.now() },
            ...state.tasks.filter((t) => t.taskHref !== task.taskHref),
          ],
        })),
      untrack: (taskHrefs) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => !taskHrefs.includes(t.taskHref)),
        })),
      reset: () => set({ tasks: [] }),
    }),
    {
      name: TRACKED_TASKS_KEY,
      // Version 1 kept a different entry shape; those entries are dropped.
      version: 2,
      migrate: () => ({ tasks: [] }),
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tasks: state.tasks }),
      merge: (persisted, current) => ({
        ...current,
        tasks: (
          (persisted as { tasks?: ITrackedTask[] } | undefined)?.tasks ?? []
        ).filter(isFresh),
      }),
    },
  ),
);

/** Re-reads the store when another tab changes it, so tabs never overwrite each other. */
export const syncTrackedTasksAcrossTabs = (): (() => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === TRACKED_TASKS_KEY) {
      void useTrackedTasksStore.persist.rehydrate();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
};
