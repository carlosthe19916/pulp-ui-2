import { ToolCallStatus, useFrontendTool } from "@copilotkit/react-core/v2";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Skeleton } from "@patternfly/react-core";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { tasksListQueryOptions } from "@app/queries/tasks";

import { refuseForbidden } from "../refuseForbidden";
import { taskErrorForModel } from "../taskErrorForModel";
import {
  currentProgress,
  TASK_STATES,
  taskListParams,
  waitingReason,
} from "./taskListParams";
import { TaskResults } from "./TaskResults";

const parameters = z.object({
  state: z
    .enum(TASK_STATES)
    .describe(
      "failed for errors, running for progress, waiting for tasks that haven't started",
    ),
  name: z
    .string()
    .optional()
    .describe(
      "Part of the task name to narrow it down, e.g. sync, publish, upload",
    ),
});

/** Lets the assistant show the newest failed, running or waiting tasks, with why. */
export const useTaskListTool = () => {
  const queryClient = useQueryClient();
  const domain = useSelectedDomain();

  useFrontendTool(
    {
      name: "showTasks",
      description:
        "Show the newest tasks in the current domain in one state: failed ones with their error, running ones with their progress, waiting ones with what holds them. Use it for failed syncs and for stuck tasks.",
      parameters,
      handler: ({ state, name }) =>
        refuseForbidden({
          action: "list tasks",
          read: async () => {
            const page = await queryClient.query(
              tasksListQueryOptions({
                domain,
                params: taskListParams({ state, name }),
              }),
            );
            return {
              count: page.count,
              shown: page.results.map((task) => ({
                name: task.name,
                created: task.pulp_created,
                ...(state === "failed" && {
                  finished: task.finished_at,
                  error: taskErrorForModel(task),
                }),
                ...(state === "running" && {
                  started: task.started_at,
                  progress: currentProgress(task),
                }),
                ...(state === "waiting" && {
                  waiting: waitingReason(task),
                  resources: task.reserved_resources_record,
                }),
              })),
            };
          },
        }),
      render: ({ args, status }) =>
        status === ToolCallStatus.InProgress || !args.state ? (
          <Skeleton screenreaderText="Looking up tasks" />
        ) : (
          <TaskResults state={args.state} name={args.name} />
        ),
    },
    [queryClient, domain],
  );
};
