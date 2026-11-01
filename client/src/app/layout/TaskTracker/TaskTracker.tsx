import type React from "react";
import { useEffect, useRef } from "react";

import { isTerminalTaskState, useTaskDetailQueries } from "@app/queries/tasks";
import {
  syncTrackedTasksAcrossTabs,
  useTrackedTasksStore,
} from "@app/stores/useTrackedTasksStore";

import {
  type ITaskOutcome,
  useTaskSettledHandler,
} from "./useTaskSettledHandler";

const FAILED_STATES = new Set(["failed", "canceled"]);

/**
 * Polls every tracked task from the app shell, so a task's outcome is reported and its
 * views refreshed even after the page that started it is gone. Renders nothing.
 */
export const TaskTracker: React.FC = () => {
  const tasks = useTrackedTasksStore((state) => state.tasks);
  const untrack = useTrackedTasksStore((state) => state.untrack);
  const onSettled = useTaskSettledHandler();

  useEffect(() => syncTrackedTasksAcrossTabs(), []);

  const probes = useTaskDetailQueries({
    taskHrefs: tasks.map((task) => task.taskHref),
  });

  const settled = tasks.flatMap((task) => {
    const probe = probes.get(task.taskHref);
    if (!probe) return [];
    const notFound = probe.notFound;
    if (!notFound && !isTerminalTaskState(probe.state)) return [];
    const outcome: ITaskOutcome = {
      ...probe,
      failed: !notFound && FAILED_STATES.has(probe.state ?? ""),
    };
    return [{ task, outcome }];
  });

  // Rerun only when the set of settled tasks changes; read the rest through refs.
  const settledSignature = settled.map(({ task }) => task.taskHref).join("|");
  const settledRef = useRef(settled);
  settledRef.current = settled;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const processedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    settledRef.current.forEach(({ task, outcome }) => {
      if (processedRef.current.has(task.taskHref)) return;
      processedRef.current.add(task.taskHref);
      untrack(task.taskHref);
      // Open tabs may each toast once; a rare duplicate isn't worth coordinating.
      onSettledRef.current({ task, outcome });
    });
  }, [settledSignature, untrack]);

  return null;
};
