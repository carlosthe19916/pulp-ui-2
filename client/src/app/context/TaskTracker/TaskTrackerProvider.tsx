import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useLocalStorage } from "@app/hooks/useStorage";
import { isTerminalTaskState, useTaskDetailQueries } from "@app/queries/tasks";

import {
  type ITrackedTask,
  type ITrackedTaskStatus,
  TaskTrackerContext,
  TRACKED_TASKS_KEY,
} from "./TaskTrackerContext";

/** Tasks older than a day are dropped, so the list can't grow without bound. */
const TRACKED_TASK_TTL_MS = 24 * 60 * 60 * 1000;
// Module-level so `useLocalStorage`'s setter (keyed on defaultValue) stays stable.
const NO_TASKS: ITrackedTask[] = [];

const isFresh = (task: ITrackedTask) =>
  Date.now() - task.startedAt < TRACKED_TASK_TTL_MS;

interface ITaskTrackerProviderProps {
  children: React.ReactNode;
}

/**
 * The tasks this browser started (the Tasks API can't filter by creator), kept across
 * reloads and tabs, with their live state from Pulp.
 */
export const TaskTrackerProvider: React.FC<ITaskTrackerProviderProps> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [stored, setStored] = useLocalStorage<ITrackedTask[]>({
    key: TRACKED_TASKS_KEY,
    defaultValue: NO_TASKS,
  });
  const entries = stored.filter(isFresh);
  const probes = useTaskDetailQueries({
    taskHrefs: entries.map((entry) => entry.taskHref),
  });

  const tasks: ITrackedTaskStatus[] = entries.map((entry) => {
    const probe = probes.get(entry.taskHref);
    const notFound = probe?.notFound ?? false;
    return {
      ...entry,
      state: probe?.state,
      notFound,
      errorMessage: probe?.errorMessage,
      createdResources: probe?.createdResources ?? [],
      isActive: !notFound && !isTerminalTaskState(probe?.state),
    };
  });

  const activeHrefs = tasks
    .filter((task) => task.isActive)
    .map((task) => task.taskHref);
  const activeSignature = activeHrefs.join("|");

  // A finished task may have created or changed anything on screen (a new distribution
  // row, a repository's latest version): refresh what's shown.
  const prevActiveRef = useRef(activeSignature);
  useEffect(() => {
    const before = prevActiveRef.current.split("|").filter(Boolean);
    prevActiveRef.current = activeSignature;
    const now = new Set(activeSignature.split("|"));
    if (before.some((href) => !now.has(href))) {
      void queryClient.invalidateQueries();
    }
  }, [activeSignature, queryClient]);

  const trackTask = useCallback(
    (task: Omit<ITrackedTask, "startedAt">) =>
      setStored((prev) => [
        { ...task, startedAt: Date.now() },
        ...prev.filter(
          (entry) => isFresh(entry) && entry.taskHref !== task.taskHref,
        ),
      ]),
    [setStored],
  );

  const clearFinished = useCallback(() => {
    const active = new Set(activeSignature.split("|"));
    setStored((prev) => prev.filter((entry) => active.has(entry.taskHref)));
  }, [activeSignature, setStored]);

  const value = useMemo(
    () => ({ tasks, trackTask, clearFinished }),
    [tasks, trackTask, clearFinished],
  );

  return <TaskTrackerContext value={value}>{children}</TaskTrackerContext>;
};
