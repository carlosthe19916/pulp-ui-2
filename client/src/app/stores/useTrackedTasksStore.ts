import type { EntityType } from "@catalog";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** The async-create entity types tracked (both return 202 + task). */
export type PendingCreateEntityType = Extract<
  EntityType,
  "distribution" | "publication"
>;

interface ITrackedTaskBase {
  taskHref: string;
  startedAt: number;
}

/** A content change (modify, add, remove, upload, restore) on one repository. */
export interface ITrackedContentChange extends ITrackedTaskBase {
  kind: "content-change";
  repositoryHref: string;
  repositoryName: string;
  /** The latest version when the change started, for the "No changes" toast. */
  latestVersion?: string;
}

/** An async create whose new row appears in its list once the task finishes. */
export interface ITrackedCreate extends ITrackedTaskBase {
  kind: "create";
  entityType: PendingCreateEntityType;
  domainName: string;
  name: string;
}

export type ITrackedTask = ITrackedContentChange | ITrackedCreate;

type TrackedTaskInput =
  Omit<ITrackedContentChange, "startedAt"> | Omit<ITrackedCreate, "startedAt">;

/** A failed content change, kept for the repository's inline alert. */
export interface ITaskFailure {
  taskHref: string;
  message?: string;
}

interface ITrackedTasksState {
  tasks: ITrackedTask[];
  /** Content-change failures by repository href; in memory only. */
  failures: Record<string, ITaskFailure>;
  track: (task: TrackedTaskInput) => void;
  untrack: (taskHref: string) => void;
  setFailure: (params: {
    repositoryHref: string;
    failure: ITaskFailure;
  }) => void;
  clearFailure: (repositoryHref: string) => void;
  reset: () => void;
}

export const TRACKED_TASKS_KEY = "pulp-ui/tracked-tasks";
/** Safety net: drop tasks that never settled within a day. */
const TRACKED_TASK_TTL_MS = 24 * 60 * 60 * 1000;

const isFresh = (task: ITrackedTask) =>
  Date.now() - task.startedAt < TRACKED_TASK_TTL_MS;

const withoutFailure = (
  failures: Record<string, ITaskFailure>,
  repositoryHref: string,
) =>
  Object.fromEntries(
    Object.entries(failures).filter(([href]) => href !== repositoryHref),
  );

/**
 * Tasks this browser started and follows until they finish, wherever the user goes;
 * persisted so a reload resumes them. `TaskTracker` polls and settles them.
 */
export const useTrackedTasksStore = create<ITrackedTasksState>()(
  persist(
    (set) => ({
      tasks: [],
      failures: {},
      track: (task) =>
        set((state) => ({
          tasks: state.tasks.some((t) => t.taskHref === task.taskHref)
            ? state.tasks.filter(isFresh)
            : [
                ...state.tasks.filter(isFresh),
                { ...task, startedAt: Date.now() },
              ],
          failures:
            task.kind === "content-change"
              ? withoutFailure(state.failures, task.repositoryHref)
              : state.failures,
        })),
      untrack: (taskHref) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.taskHref !== taskHref),
        })),
      setFailure: ({ repositoryHref, failure }) =>
        set((state) => ({
          failures: { ...state.failures, [repositoryHref]: failure },
        })),
      clearFailure: (repositoryHref) =>
        set((state) => ({
          failures: withoutFailure(state.failures, repositoryHref),
        })),
      reset: () => set({ tasks: [], failures: {} }),
    }),
    {
      name: TRACKED_TASKS_KEY,
      version: 1,
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
