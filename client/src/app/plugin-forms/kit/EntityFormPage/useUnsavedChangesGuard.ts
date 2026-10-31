import { useRef } from "react";

import { useBlocker } from "@tanstack/react-router";

/**
 * Asks before leaving a form with unsaved changes (in-app navigation and reload). Call
 * `allowLeave()` before navigating away after a successful save.
 */
export const useUnsavedChangesGuard = ({ when }: { when: boolean }) => {
  // A ref, not state: the save's navigation runs before a re-render could apply it.
  const leavingRef = useRef(false);
  const shouldBlock = () => when && !leavingRef.current;

  const blocker = useBlocker({
    // Same-page navigations (the create page's `?type=`) aren't leaving.
    shouldBlockFn: ({ current, next }) =>
      shouldBlock() && current.pathname !== next.pathname,
    enableBeforeUnload: shouldBlock,
    withResolver: true,
  });

  return {
    isBlocked: blocker.status === "blocked",
    proceed: () => blocker.proceed?.(),
    stay: () => blocker.reset?.(),
    allowLeave: () => {
      leavingRef.current = true;
    },
  };
};
