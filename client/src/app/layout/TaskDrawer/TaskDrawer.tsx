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

import { useTaskTracker } from "@app/hooks/useTaskTracker";

import { TaskDrawerItem } from "./TaskDrawerItem";

interface ITaskDrawerProps {
  onClose: () => void;
}

/** The tasks this browser started, newest first, with their live state. */
export const TaskDrawer: React.FC<ITaskDrawerProps> = ({ onClose }) => {
  const { tasks, clearFinished } = useTaskTracker();
  const activeCount = tasks.filter((task) => task.isActive).length;
  const hasFinished = activeCount < tasks.length;

  return (
    <NotificationDrawer>
      <NotificationDrawerHeader
        title="Tasks"
        customText={activeCount > 0 ? `${activeCount} running` : undefined}
        onClose={onClose}
        closeButtonAriaLabel="Close tasks"
      >
        {hasFinished && (
          <Button variant="link" isInline onClick={clearFinished}>
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
