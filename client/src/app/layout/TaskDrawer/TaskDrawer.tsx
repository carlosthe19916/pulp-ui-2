import type React from "react";

import {
  Button,
  EmptyState,
  EmptyStateBody,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
} from "@patternfly/react-core";

import { useTrackedTasksStore } from "@app/stores/useTrackedTasksStore";

import { TaskDrawerItem } from "./TaskDrawerItem";
import { useTrackedTasks } from "./useTrackedTasks";

export const TASK_DRAWER_ID = "task-drawer";

interface ITaskDrawerProps {
  onClose: () => void;
}

/** The tasks this browser started, newest first, with their live state. */
export const TaskDrawer: React.FC<ITaskDrawerProps> = ({ onClose }) => {
  const tasks = useTrackedTasks();
  const untrack = useTrackedTasksStore((state) => state.untrack);
  const finished = tasks
    .filter((task) => !task.isActive)
    .map((task) => task.taskHref);
  const activeCount = tasks.length - finished.length;

  return (
    <NotificationDrawer
      id={TASK_DRAWER_ID}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <NotificationDrawerHeader
        title="Tasks"
        customText={activeCount > 0 ? `${activeCount} running` : undefined}
        onClose={onClose}
        closeButtonAriaLabel="Close tasks"
      >
        {finished.length > 0 && (
          <Button variant="link" isInline onClick={() => untrack(finished)}>
            Clear finished
          </Button>
        )}
      </NotificationDrawerHeader>
      <NotificationDrawerBody>
        {tasks.length === 0 ? (
          <EmptyState titleText="No tasks" headingLevel="h3">
            <EmptyStateBody>
              Tasks you start in this browser, such as a sync or a publish, show
              here until you clear them.
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <NotificationDrawerList aria-label="Tasks">
            {tasks.map((task) => (
              <TaskDrawerItem
                key={task.taskHref}
                task={task}
                onNavigate={onClose}
              />
            ))}
          </NotificationDrawerList>
        )}
      </NotificationDrawerBody>
    </NotificationDrawer>
  );
};
