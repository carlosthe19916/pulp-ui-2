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

import { useTrackedTasks } from "../useTrackedTasks";
import { TaskDrawerItem } from "./TaskDrawerItem";

export const TASK_DRAWER_ID = "task-drawer";

interface ITaskDrawerProps {
  onClose: () => void;
}

/** The tasks this browser started, newest first, with their live state. */
export const TaskDrawer: React.FC<ITaskDrawerProps> = ({ onClose }) => {
  const tasks = useTrackedTasks();
  const untrack = useTrackedTasksStore((state) => state.untrack);
  const clearableHrefs = tasks
    .filter((task) => !task.isActive)
    .map((task) => task.taskHref);
  const activeCount = tasks.length - clearableHrefs.length;

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
        {clearableHrefs.length > 0 && (
          <Button
            variant="link"
            isInline
            onClick={() => untrack(clearableHrefs)}
          >
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
