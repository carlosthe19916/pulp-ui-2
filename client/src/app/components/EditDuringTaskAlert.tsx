import type React from "react";

import { useNavigate } from "@tanstack/react-router";

import { Alert, AlertActionLink } from "@patternfly/react-core";

import type { EntityTaskKind } from "@app/hooks/useResourceTasks";
import { extractTaskDomain, extractTaskId } from "@app/utils/taskHref";

const TITLE_BY_KIND: Partial<Record<EntityTaskKind, string>> = {
  sync: "Sync in progress",
  modify: "Creating a new version",
  update: "An update is in progress",
  delete: "Deletion in progress",
};

interface IEditDuringTaskAlertProps {
  /** What is being edited, e.g. "repository". */
  entityLabel: string;
  running: { taskHref?: string; kind?: EntityTaskKind };
}

/** Tells an edit page that a task runs on the object; Pulp queues the save behind it. */
export const EditDuringTaskAlert: React.FC<IEditDuringTaskAlertProps> = ({
  entityLabel,
  running: { taskHref, kind },
}) => {
  const navigate = useNavigate();
  return (
    <Alert
      variant="info"
      isInline
      title={
        (kind && TITLE_BY_KIND[kind]) ??
        `A task is running on this ${entityLabel}`
      }
      actionLinks={
        taskHref && (
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
        )
      }
    >
      You can still save: your changes are applied when the task finishes.
    </Alert>
  );
};
