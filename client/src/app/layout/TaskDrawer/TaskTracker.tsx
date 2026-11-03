import type React from "react";
import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useTrackedTasks } from "./useTrackedTasks";

/**
 * Mounted once in the app shell: when a tracked task finishes, refreshes what's on screen,
 * since it may have created or changed anything (a new distribution row, a repository's
 * latest version). Renders nothing.
 */
export const TaskTracker: React.FC = () => {
  const queryClient = useQueryClient();
  const activeSignature = useTrackedTasks()
    .filter((task) => task.isActive)
    .map((task) => task.taskHref)
    .join("|");

  const prevActiveRef = useRef(activeSignature);
  useEffect(() => {
    const before = prevActiveRef.current.split("|").filter(Boolean);
    prevActiveRef.current = activeSignature;
    const now = new Set(activeSignature.split("|"));
    if (before.some((href) => !now.has(href))) {
      void queryClient.invalidateQueries();
    }
  }, [activeSignature, queryClient]);

  return null;
};
