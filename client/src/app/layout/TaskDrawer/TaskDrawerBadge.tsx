import type React from "react";

import { NotificationBadge } from "@patternfly/react-core";

import { useTaskTracker } from "@app/hooks/useTaskTracker";

export const TASK_DRAWER_TOGGLE_ID = "task-drawer-toggle";

interface ITaskDrawerBadgeProps {
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Opens the task drawer; counts the tasks still running and calls attention to a failed
 * one until it is cleared.
 */
export const TaskDrawerBadge: React.FC<ITaskDrawerBadgeProps> = ({
  isExpanded,
  onToggle,
}) => {
  const { tasks } = useTaskTracker();
  const activeCount = tasks.filter((task) => task.isActive).length;
  const hasFailed = tasks.some(
    (task) => task.state === "failed" || task.state === "canceled",
  );

  return (
    <NotificationBadge
      id={TASK_DRAWER_TOGGLE_ID}
      variant={hasFailed ? "attention" : activeCount > 0 ? "unread" : "read"}
      count={activeCount}
      isExpanded={isExpanded}
      onClick={onToggle}
      isDocked
      aria-label={activeCount > 0 ? `Tasks, ${activeCount} running` : "Tasks"}
    />
  );
};
