import type React from "react";

import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";

import {
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from "@patternfly/react-core";

import { TaskStateLabel } from "@app/components/TaskStateLabel";
import {
  extractIdFromHref,
  parseRepositoryVersionHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { extractTaskDomain, extractTaskId } from "@app/utils/taskHref";

import { taskVariant } from "./taskVariant";
import type { ITrackedTaskStatus } from "./useTrackedTasks";

interface ITaskDrawerItemProps {
  task: ITrackedTaskStatus;
  /** Called when a link in the item is followed. */
  onNavigate: () => void;
}

/** One tracked task: what was started, its state, its error or new version, and a link. */
export const TaskDrawerItem: React.FC<ITaskDrawerItemProps> = ({
  task,
  onNavigate,
}) => {
  const variant = taskVariant(task.state);
  const versions = task.createdResources
    .map((href) => parseRepositoryVersionHref(href))
    .filter((version) => !!version);

  return (
    <NotificationDrawerListItem variant={variant} isRead>
      <NotificationDrawerListItemHeader
        title={task.title}
        variant={variant}
        srTitle={`${task.state ?? "pending"} task:`}
        headingLevel="h3"
      />
      <NotificationDrawerListItemBody
        timestamp={dayjs(task.startedAt).fromNow()}
      >
        {task.notFound ? (
          "This task was removed."
        ) : task.isUnreadable ? (
          "Its state can't be read right now."
        ) : (
          <>
            {task.state && <TaskStateLabel state={task.state} isCompact />}{" "}
            {task.errorMessage && <>{task.errorMessage} </>}
            {versions.map((version) => (
              <span key={version.repositoryHref}>
                <Link
                  to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber"
                  params={{
                    pulpDomain: extractTaskDomain(version.repositoryHref),
                    repositoryType:
                      resolvePulpType(version.repositoryHref) ?? "",
                    repositoryId: extractIdFromHref(version.repositoryHref),
                    versionNumber: version.number,
                  }}
                  onClick={onNavigate}
                >
                  Version {version.number} created
                </Link>{" "}
              </span>
            ))}
            <Link
              to="/monitoring/$pulpDomain/tasks/$taskId"
              params={{
                pulpDomain: extractTaskDomain(task.taskHref),
                taskId: extractTaskId(task.taskHref),
              }}
              onClick={onNavigate}
            >
              View task
            </Link>
          </>
        )}
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
};
