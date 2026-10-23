import type React from "react";

import { useNavigate } from "@tanstack/react-router";

import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
} from "@patternfly/react-core";

import type { RepositoryResponse } from "@app/client";
import type { EntityTaskKind } from "@app/hooks/useResourceTasks";
import { latestVersionNumber } from "@app/utils/latestVersionNumber";
import { extractTaskDomain, extractTaskId } from "@app/utils/taskHref";

const RUNNING_COPY: Partial<
  Record<EntityTaskKind, { title: string; body: string }>
> = {
  modify: {
    title: "Creating a new version…",
    body: "Content changes are paused until it finishes.",
  },
  sync: {
    title: "Sync in progress",
    body: "The content below may change. Content changes are paused until it finishes.",
  },
};

const DEFAULT_RUNNING_COPY = {
  title: "A task is running on this repository",
  body: "Content changes are paused until it finishes.",
};

interface IRepositoryTaskAlertProps {
  repository: RepositoryResponse;
  /** The task running on the repository, if any. */
  running?: { taskHref?: string; kind?: EntityTaskKind };
  /** The last content change failed. */
  failure?: { taskHref: string; message?: string } | null;
  onCloseFailure: () => void;
}

/**
 * Inline status above a repository's content: a running task (writes are paused),
 * or the last failed content change ("Nothing changed").
 */
export const RepositoryTaskAlert: React.FC<IRepositoryTaskAlertProps> = ({
  repository,
  running,
  failure,
  onCloseFailure,
}) => {
  const navigate = useNavigate();
  const viewTask = (taskHref: string) => (
    <AlertActionLink
      onClick={() =>
        void navigate({
          to: "/monitoring/$pulpDomain/tasks/$taskId",
          params: {
            pulpDomain: extractTaskDomain(taskHref),
            taskId: extractTaskId(taskHref),
          },
        })
      }
    >
      View task
    </AlertActionLink>
  );

  if (running) {
    const copy =
      (running.kind && RUNNING_COPY[running.kind]) || DEFAULT_RUNNING_COPY;
    return (
      <Alert
        variant="info"
        isInline
        title={copy.title}
        actionLinks={running.taskHref ? viewTask(running.taskHref) : undefined}
      >
        {copy.body}
      </Alert>
    );
  }

  if (failure) {
    const name = `"${repository.name}"`;
    const versionNumber = latestVersionNumber(repository);
    return (
      <Alert
        variant="warning"
        isInline
        title={`Could not change the content of ${name}`}
        actionClose={<AlertActionCloseButton onClose={onCloseFailure} />}
        actionLinks={viewTask(failure.taskHref)}
      >
        {failure.message ? `${failure.message} ` : ""}
        Nothing changed.
        {versionNumber !== undefined &&
          ` ${name} is still at version ${versionNumber}.`}
      </Alert>
    );
  }

  return null;
};
