import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { ChartDonutUtilization } from "@patternfly/react-charts/victory";
import {
  Bullseye,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Skeleton,
  Stack,
} from "@patternfly/react-core";

import { useApiStatus } from "@app/hooks/useApiStatus";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { type TaskState, useTasksCountQueries } from "@app/queries/tasks";

import { DASHBOARD_REFRESH_INTERVAL, hoursAgo } from "../utils/dashboardTimes";
import { DashboardCard } from "./DashboardCard";
import { type StatusLevel, StatusText } from "./StatusText";

interface IActivityRow {
  term: string;
  state: TaskState;
  count?: number;
  status: StatusLevel;
}

/** Running, waiting and recently failed tasks in the domain, and how busy workers are. */
export const TaskActivityCard: React.FC = () => {
  const { name: pulpDomain, enabled: domainsEnabled } = useSelectedDomain();
  const onlineWorkers = useApiStatus().status?.online_workers.length ?? 0;
  // Fixed at mount so the query key doesn't change every render.
  const [since] = useState(() => hoursAgo(24));
  const {
    counts: [running, waiting, failed],
    isLoading,
  } = useTasksCountQueries({
    paramsList: [
      { state: "running" },
      { state: "waiting" },
      { state: "failed", finished_at__gte: since },
    ],
    refetchInterval: DASHBOARD_REFRESH_INTERVAL,
  });

  const rows: IActivityRow[] = [
    { term: "Running", state: "running", count: running, status: "neutral" },
    { term: "Waiting", state: "waiting", count: waiting, status: "neutral" },
    {
      term: "Failed (last 24 h)",
      state: "failed",
      count: failed,
      status: (failed ?? 0) > 0 ? "danger" : "success",
    },
  ];
  // Immediate tasks can run in API servers, so running may exceed the workers.
  const busy = Math.min(running ?? 0, onlineWorkers);

  return (
    <DashboardCard
      title="Task activity"
      footer={
        <Link to="/monitoring/$pulpDomain/tasks" params={{ pulpDomain }}>
          View tasks
        </Link>
      }
    >
      {isLoading ? (
        <Skeleton screenreaderText="Loading task activity" height="12rem" />
      ) : (
        <Stack hasGutter>
          <DescriptionList
            isCompact
            isHorizontal
            horizontalTermWidthModifier={{ default: "20ch" }}
          >
            {rows.map((row) => (
              <DescriptionListGroup key={row.state}>
                <DescriptionListTerm>
                  <Link
                    to="/monitoring/$pulpDomain/tasks"
                    params={{ pulpDomain }}
                    search={{ state: [row.state] }}
                  >
                    {row.term}
                  </Link>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {row.status === "neutral" ? (
                    (row.count ?? "—")
                  ) : (
                    <StatusText status={row.status}>
                      {row.count ?? "—"}
                    </StatusText>
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
          {onlineWorkers > 0 && (
            <Bullseye>
              <ChartDonutUtilization
                ariaTitle="Workers busy"
                ariaDesc={`${busy} of ${onlineWorkers} workers are running a task`}
                constrainToVisibleArea
                data={{
                  x: "Busy",
                  y: Math.round((busy / onlineWorkers) * 100),
                }}
                labels={({ datum }: { datum: { x?: string } }) =>
                  datum.x ? `${busy} of ${onlineWorkers} busy` : null
                }
                subTitle="workers busy"
                title={`${busy} of ${onlineWorkers}`}
                width={180}
                height={180}
              />
            </Bullseye>
          )}
          {domainsEnabled && (
            <Content component={ContentVariants.small}>
              Counts tasks in this domain only.
            </Content>
          )}
        </Stack>
      )}
    </DashboardCard>
  );
};
