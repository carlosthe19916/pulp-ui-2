import type React from "react";

import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";

import {
  Content,
  ContentVariants,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from "@patternfly/react-core";

import { TaskStateLabel } from "@app/components/TaskStateLabel";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useTaskDetailQueries } from "@app/queries/tasks";
import { useRecentTasksStore } from "@app/stores/useRecentTasksStore";
import {
  extractTaskDomain,
  extractTaskId,
  shortTaskName,
} from "@app/utils/taskHref";

import { DashboardCard } from "./DashboardCard";

/** The last tasks this browser started, in any domain, with their live state. */
export const RecentTasksCard: React.FC = () => {
  const tasks = useRecentTasksStore((state) => state.tasks);
  const domainsEnabled = useApiStatus().status?.domain_enabled ?? false;
  const probes = useTaskDetailQueries({
    taskHrefs: tasks.map((task) => task.taskHref),
  });

  return (
    <DashboardCard title="Your recent tasks">
      {tasks.length === 0 ? (
        <Content component={ContentVariants.p}>
          Tasks you start in this browser, such as a sync or a publish, show
          here.
        </Content>
      ) : (
        <DataList aria-label="Your recent tasks" isCompact>
          {tasks.map(({ taskHref, startedAt }) => {
            const probe = probes.get(taskHref);
            const pulpDomain = extractTaskDomain(taskHref);
            return (
              <DataListItem key={taskHref}>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="name" width={3}>
                        {probe?.notFound ? (
                          "Task removed"
                        ) : (
                          <Link
                            to="/monitoring/$pulpDomain/tasks/$taskId"
                            params={{
                              pulpDomain,
                              taskId: extractTaskId(taskHref),
                            }}
                          >
                            {probe?.name ? shortTaskName(probe.name) : "Task"}
                          </Link>
                        )}
                        {domainsEnabled && (
                          <Content component={ContentVariants.small}>
                            {" "}
                            in {pulpDomain}
                          </Content>
                        )}
                      </DataListCell>,
                      <DataListCell key="state" width={1}>
                        {probe?.state && (
                          <TaskStateLabel state={probe.state} isCompact />
                        )}
                      </DataListCell>,
                      <DataListCell key="time" width={2}>
                        {dayjs(startedAt).fromNow()}
                      </DataListCell>,
                    ]}
                  />
                </DataListItemRow>
              </DataListItem>
            );
          })}
        </DataList>
      )}
    </DashboardCard>
  );
};
