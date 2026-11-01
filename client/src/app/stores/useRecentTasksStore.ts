import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** A task this browser started (a write answered with `202` and a task href). */
export interface IRecentTask {
  taskHref: string;
  startedAt: number;
}

interface IRecentTasksState {
  tasks: IRecentTask[];
  record: (taskHref: string) => void;
  reset: () => void;
}

export const RECENT_TASKS_KEY = "pulp-ui/recent-tasks";
/** How many recent tasks are kept, newest first. */
export const RECENT_TASKS_LIMIT = 5;

/**
 * The tasks this browser started, newest first; the Tasks API can't filter by creator,
 * so the browser remembers them. Recorded by the axios response interceptor.
 */
export const useRecentTasksStore = create<IRecentTasksState>()(
  persist(
    (set) => ({
      tasks: [],
      record: (taskHref) =>
        set((state) => ({
          tasks: [
            { taskHref, startedAt: Date.now() },
            ...state.tasks.filter((task) => task.taskHref !== taskHref),
          ].slice(0, RECENT_TASKS_LIMIT),
        })),
      reset: () => set({ tasks: [] }),
    }),
    {
      name: RECENT_TASKS_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tasks: state.tasks }),
    },
  ),
);

/** Re-reads the store when another tab changes it, so tabs never overwrite each other. */
export const syncRecentTasksAcrossTabs = (): (() => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === RECENT_TASKS_KEY) {
      void useRecentTasksStore.persist.rehydrate();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
};
