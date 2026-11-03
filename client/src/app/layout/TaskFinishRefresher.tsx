import type React from "react";
import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { isTerminalTaskState, taskKeys } from "@app/queries/tasks";

import { useTrackedTasks } from "./useTrackedTasks";

const [TASKS_ROOT_KEY] = taskKeys.all();

/**
 * Mounted once in the app shell: when a task in the drawer that was seen running finishes,
 * refreshes what's on screen, since it may have created or changed anything (a new
 * distribution row, a repository's latest version). Tasks started elsewhere are refreshed
 * per row by `useResourceTasks`. Renders nothing.
 */
export const TaskFinishRefresher: React.FC = () => {
  const queryClient = useQueryClient();
  // Only tasks whose running state was read: a task still loading after a reload isn't
  // "finishing" when its first read says completed.
  const runningSignature = useTrackedTasks()
    .filter((task) => !!task.state && !isTerminalTaskState(task.state))
    .map((task) => task.taskHref)
    .join("|");

  const prevRunningRef = useRef(runningSignature);
  useEffect(() => {
    const wasRunning = prevRunningRef.current.split("|").filter(Boolean);
    prevRunningRef.current = runningSignature;
    const runningNow = new Set(runningSignature.split("|"));
    if (wasRunning.some((href) => !runningNow.has(href))) {
      void queryClient.invalidateQueries({
        // Finished task details don't change; the tracker's own reads stay as they are.
        predicate: ({ queryKey }) =>
          !(queryKey[0] === TASKS_ROOT_KEY && queryKey[1] === "detail"),
      });
    }
  }, [runningSignature, queryClient]);

  return null;
};
