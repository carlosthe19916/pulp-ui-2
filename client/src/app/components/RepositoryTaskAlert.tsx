import type React from "react";

import { useNavigate } from "@tanstack/react-router";

import { Alert, AlertActionLink } from "@patternfly/react-core";

import type { EntityTaskKind } from "@app/hooks/useResourceTasks";
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
  /** The task running on the repository. */
  running: { taskHref?: string; kind?: EntityTaskKind };
}

/** Inline status above a repository's content while a task runs (writes are paused). */
export const RepositoryTaskAlert: React.FC<IRepositoryTaskAlertProps> = ({
  running,
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
};
