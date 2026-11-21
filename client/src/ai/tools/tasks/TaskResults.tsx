import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Content,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Flex,
  Skeleton,
} from "@patternfly/react-core";

import { TaskStateLabel } from "@app/components/TaskStateLabel";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useTasksListQuery } from "@app/queries/tasks";
import { extractTaskId, shortTaskName } from "@app/utils/taskHref";
import { formatDateTime, getTaskErrorMessage } from "@app/utils/utils";

import { ToolReadError } from "../../components/ToolReadError";
import {
  type AssistantTaskState,
  currentProgress,
  taskListParams,
  waitingReason,
} from "./taskListParams";

interface ITaskResultsProps {
  state: AssistantTaskState;
  name?: string;
}

/** The newest tasks in one state, each with its error, progress or what holds it. */
export const TaskResults: React.FC<ITaskResultsProps> = ({ state, name }) => {
  const { name: pulpDomain } = useSelectedDomain();
  const { data, isLoading, error } = useTasksListQuery({
    params: taskListParams({ state, name }),
  });

  if (isLoading) {
    return <Skeleton screenreaderText="Loading tasks" />;
  }
  if (error) {
    return <ToolReadError error={error} action="list tasks" subject="tasks" />;
  }

  const tasks = data?.results ?? [];
  const count = data?.count ?? 0;
  const matching = name ? ` matching "${name}"` : "";
  const noun = count === 1 ? "task" : "tasks";
  const title =
    count === 0
      ? `No ${state} tasks${matching}`
      : `${count} ${state} ${noun}${matching}`;

  return (
    <Card isCompact>
      <CardHeader>
        <CardTitle component="h3">{title}</CardTitle>
      </CardHeader>
      {tasks.length > 0 ? (
        <CardBody>
          <DataList aria-label={title} isCompact>
            {tasks.map((task) => {
              const detail =
                state === "failed"
                  ? getTaskErrorMessage(task)
                  : state === "waiting"
                    ? waitingReason(task)
                    : currentProgress(task);
              const when =
                state === "failed" ? task.finished_at : task.pulp_created;
              return (
                <DataListItem key={task.pulp_href}>
                  <DataListItemRow>
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key="task">
                          <Flex
                            direction={{ default: "column" }}
                            spaceItems={{ default: "spaceItemsXs" }}
                          >
                            <Flex spaceItems={{ default: "spaceItemsSm" }}>
                              {task.pulp_href ? (
                                <Link
                                  to="/monitoring/$pulpDomain/tasks/$taskId"
                                  params={{
                                    pulpDomain,
                                    taskId: extractTaskId(task.pulp_href),
                                  }}
                                >
                                  {shortTaskName(task.name)}
                                </Link>
                              ) : (
                                shortTaskName(task.name)
                              )}
                              <TaskStateLabel state={task.state} isCompact />
                            </Flex>
                            {detail ? (
                              <Content component="p">{detail}</Content>
                            ) : null}
                            <Content component="small">
                              {formatDateTime(when)}
                            </Content>
                          </Flex>
                        </DataListCell>,
                      ]}
                    />
                  </DataListItemRow>
                </DataListItem>
              );
            })}
          </DataList>
        </CardBody>
      ) : null}
      <CardFooter>
        <Link
          to="/monitoring/$pulpDomain/tasks"
          params={{ pulpDomain }}
          search={{ state: [state] }}
        >
          View {state} tasks
        </Link>
      </CardFooter>
    </Card>
  );
};
