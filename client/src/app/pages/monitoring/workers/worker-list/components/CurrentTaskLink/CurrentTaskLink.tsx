import type React from "react";

import { Link } from "@tanstack/react-router";

import { useTaskDetailQuery } from "@app/queries/tasks";
import {
  extractTaskDomain,
  extractTaskId,
  shortTaskName,
} from "@app/utils/taskHref";

interface ICurrentTaskLinkProps {
  href: string;
}

/** Link to the task a worker runs, named after the task once it loads. */
export const CurrentTaskLink: React.FC<ICurrentTaskLinkProps> = ({ href }) => {
  const { data: task } = useTaskDetailQuery({ href });

  return (
    <Link
      to="/monitoring/$pulpDomain/tasks/$taskId"
      params={{
        pulpDomain: extractTaskDomain(href),
        taskId: extractTaskId(href),
      }}
    >
      {task?.name ? shortTaskName(task.name) : "Running a task"}
    </Link>
  );
};
